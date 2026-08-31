#!/usr/bin/env python3
"""
OptionFlow Sentinel — CLI Monitoring Dashboard
Usage: python cli.py <command> [options]
"""
from __future__ import annotations

import sys
import os
import asyncio
import argparse
from datetime import datetime, timezone
from typing import Any

# Ensure backend root is on sys.path so `app.*` imports work
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Load .env before touching settings
from dotenv import load_dotenv

_env_path = os.path.join(_backend_dir, ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)

from app.core.config import settings  # noqa: E402

# ---------------------------------------------------------------------------
# ANSI helpers
# ---------------------------------------------------------------------------
_GREEN = "\033[92m"
_RED = "\033[91m"
_YELLOW = "\033[93m"
_CYAN = "\033[96m"
_BOLD = "\033[1m"
_RESET = "\033[0m"


def _ok(msg: str) -> str:
    return f"{_GREEN}{msg}{_RESET}"


def _err(msg: str) -> str:
    return f"{_RED}{msg}{_RESET}"


def _warn(msg: str) -> str:
    return f"{_YELLOW}{msg}{_RESET}"


def _header(msg: str) -> str:
    return f"{_BOLD}{_CYAN}{msg}{_RESET}"


# ---------------------------------------------------------------------------
# Table formatter (tabulate if available, else manual)
# ---------------------------------------------------------------------------
try:
    from tabulate import tabulate as _tabulate  # type: ignore

    def _fmt_table(rows: list[list[str]], headers: list[str]) -> str:
        return _tabulate(rows, headers=headers, tablefmt="rounded_grid")
except ImportError:

    def _fmt_table(rows: list[list[str]], headers: list[str]) -> str:
        """Minimal fallback when tabulate is not installed."""
        if not rows:
            return "  (no data)"
        col_widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                col_widths[i] = max(col_widths[i], len(str(cell)))

        sep = "  ".join("─" * (w + 2) for w in col_widths)

        def _fmt_row(cells: list[str]) -> str:
            return "  ".join(f" {str(c).ljust(w)} " for c, w in zip(cells, col_widths))

        lines = [_fmt_row(headers), sep]
        lines.extend(_fmt_row(r) for r in rows)
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Alpaca helpers
# ---------------------------------------------------------------------------
def _get_alpaca_client():
    """Create an Alpaca TradingClient from env vars."""
    if not settings.ALPACA_API_KEY or not settings.ALPACA_SECRET_KEY:
        print(_err("Error: ALPACA_API_KEY / ALPACA_SECRET_KEY not set in .env"))
        sys.exit(1)
    from alpaca.trading.client import TradingClient

    return TradingClient(
        api_key=settings.ALPACA_API_KEY,
        secret_key=settings.ALPACA_SECRET_KEY,
        paper=True,
    )


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def cmd_status(_args: argparse.Namespace) -> None:
    """Show connectivity health for MongoDB, Alpaca, and the LLM endpoint."""
    print(_header("=== System Health ===\n"))

    # MongoDB
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        async def _ping_mongo() -> bool:
            client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=3000)
            await client.admin.command("ping")
            client.close()
            return True

        ok = asyncio.run(_ping_mongo())
        print(f"  MongoDB      : {_ok('CONNECTED')}  ({settings.MONGODB_URL})")
    except Exception as exc:
        print(f"  MongoDB      : {_err('UNREACHABLE')}  ({exc})")

    # Alpaca
    try:
        client = _get_alpaca_client()
        acct = client.get_account()
        print(f"  Alpaca       : {_ok('CONNECTED')}  (paper={settings.ALPACA_BASE_URL})")
    except Exception as exc:
        print(f"  Alpaca       : {_err('UNREACHABLE')}  ({exc})")

    # LLM (NVIDIA)
    if settings.NVIDIA_API_KEY:
        print(f"  LLM (NVIDIA) : {_ok('KEY SET')}  model={settings.LLM_MODEL}")
    else:
        print(f"  LLM (NVIDIA) : {_warn('NO KEY')}  inference will fail")

    print()


def cmd_positions(_args: argparse.Namespace) -> None:
    """List open Alpaca positions with P&L."""
    print(_header("=== Open Positions ===\n"))
    try:
        client = _get_alpaca_client()
        positions = client.get_all_positions()
    except Exception as exc:
        print(_err(f"Failed to fetch positions: {exc}"))
        sys.exit(1)

    if not positions:
        print("  No open positions.")
        return

    headers = ["Symbol", "Side", "Qty", "Entry", "Current", "Mkt Value", "P&L", "P&L %"]
    rows: list[list[str]] = []
    for p in positions:
        pl = float(p.unrealized_pl)
        color = _GREEN if pl >= 0 else _RED
        rows.append([
            p.symbol,
            p.side.value if hasattr(p.side, "value") else str(p.side),
            str(p.qty),
            f"${float(p.avg_entry_price):,.2f}",
            f"${float(p.current_price):,.2f}",
            f"${float(p.market_value):,.2f}",
            f"{color}${pl:+,.2f}{_RESET}",
            f"{color}{float(p.unrealized_plpc)*100:+.2f}%{_RESET}",
        ])

    print(_fmt_table(rows, headers))
    print()


def cmd_orders(_args: argparse.Namespace) -> None:
    """Show recent Alpaca orders (last 20)."""
    print(_header("=== Recent Orders ===\n"))
    try:
        from alpaca.trading.requests import GetOrdersRequest
        from alpaca.trading.enums import QueryOrderStatus

        client = _get_alpaca_client()
        req = GetOrdersRequest(status=QueryOrderStatus.ALL, limit=20)
        orders = client.get_orders(req)
    except Exception as exc:
        print(_err(f"Failed to fetch orders: {exc}"))
        sys.exit(1)

    if not orders:
        print("  No recent orders.")
        return

    headers = ["Submitted", "Symbol", "Side", "Qty", "Type", "Status", "Filled Price"]
    rows: list[list[str]] = []
    for o in orders:
        submitted = str(o.submitted_at)[:19] if o.submitted_at else "-"
        filled = f"${float(o.filled_avg_price):,.2f}" if o.filled_avg_price else "-"
        rows.append([
            submitted,
            o.symbol,
            o.side.value if hasattr(o.side, "value") else str(o.side),
            str(o.qty),
            o.type.value if hasattr(o.type, "value") else str(o.type),
            o.status.value if hasattr(o.status, "value") else str(o.status),
            filled,
        ])

    print(_fmt_table(rows, headers))
    print()


def cmd_account(_args: argparse.Namespace) -> None:
    """Show Alpaca account summary."""
    print(_header("=== Account Summary ===\n"))
    try:
        client = _get_alpaca_client()
        acct = client.get_account()
    except Exception as exc:
        print(_err(f"Failed to fetch account: {exc}"))
        sys.exit(1)

    fields = [
        ("Account ID", str(acct.id)),
        ("Status", acct.status.value if hasattr(acct.status, "value") else str(acct.status)),
        ("Equity", f"${float(acct.equity):,.2f}"),
        ("Cash", f"${float(acct.cash):,.2f}"),
        ("Buying Power", f"${float(acct.buying_power):,.2f}"),
        ("Portfolio Value", f"${float(acct.portfolio_value):,.2f}"),
        ("Currency", acct.currency),
    ]
    for label, value in fields:
        print(f"  {label:<20s} {value}")
    print()


def cmd_clock(_args: argparse.Namespace) -> None:
    """Show market clock (open/close times)."""
    print(_header("=== Market Clock ===\n"))
    try:
        client = _get_alpaca_client()
        clock = client.get_clock()
    except Exception as exc:
        print(_err(f"Failed to fetch clock: {exc}"))
        sys.exit(1)

    status = _ok("OPEN") if clock.is_open else _warn("CLOSED")
    print(f"  Market Status  : {status}")
    print(f"  Current Time   : {clock.timestamp}")
    print(f"  Next Open      : {clock.next_open}")
    print(f"  Next Close     : {clock.next_close}")
    print()


def cmd_kill_switch(_args: argparse.Namespace) -> None:
    """Emergency: close ALL open positions via market orders."""
    print(_header("=== KILL SWITCH — Close All Positions ===\n"))

    try:
        client = _get_alpaca_client()
        positions = client.get_all_positions()
    except Exception as exc:
        print(_err(f"Failed to fetch positions: {exc}"))
        sys.exit(1)

    if not positions:
        print(_ok("No open positions to close."))
        return

    # Preview
    print(_warn("The following open positions will be CLOSED with market orders:\n"))
    headers = ["Symbol", "Side", "Qty", "Mkt Value", "Unrealized P&L"]
    rows: list[list[str]] = []
    total_pl = 0.0
    for p in positions:
        pl = float(p.unrealized_pl)
        total_pl += pl
        rows.append([
            p.symbol,
            p.side.value if hasattr(p.side, "value") else str(p.side),
            str(p.qty),
            f"${float(p.market_value):,.2f}",
            f"${pl:+,.2f}",
        ])
    print(_fmt_table(rows, headers))
    print(f"\n  Total Unrealized P&L: ${total_pl:+,.2f}")
    print()

    confirm = input("  Are you SURE you want to close ALL positions? [y/N] ").strip().lower()
    if confirm != "y":
        print(_warn("Aborted."))
        return

    from alpaca.trading.requests import MarketOrderRequest
    from alpaca.trading.enums import OrderSide, TimeInForce

    print()
    results: list[list[str]] = []
    for p in positions:
        try:
            # If long, sell to close; if short, buy to close
            side = OrderSide.SELL if p.side.value == "long" else OrderSide.BUY
            req = MarketOrderRequest(
                symbol=p.symbol,
                qty=abs(int(float(p.qty))),
                side=side,
                time_in_force=TimeInForce.DAY,
            )
            order = client.submit_order(req)
            results.append([p.symbol, _ok("CLOSED"), str(order.id)])
        except Exception as exc:
            results.append([p.symbol, _err(f"FAILED: {exc}")])

    print(_header("Kill-switch results:\n"))
    print(_fmt_table(results, ["Symbol", "Status", "Order ID"]))
    print()


def cmd_audit(_args: argparse.Namespace) -> None:
    """Show recent audit trail entries from MongoDB."""
    print(_header("=== Recent Audit Trail ===\n"))
    limit = _args.limit or 20

    async def _fetch() -> list[dict[str, Any]]:
        from motor.motor_asyncio import AsyncIOMotorClient
        from bson import ObjectId

        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        target_db = client[settings.DATABASE_NAME]
        cursor = target_db.audit_trail.find().sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        client.close()
        return docs

    try:
        docs = asyncio.run(_fetch())
    except Exception as exc:
        print(_err(f"Failed to query audit_trail: {exc}"))
        sys.exit(1)

    if not docs:
        print("  No audit trail entries found.")
        return

    headers = ["Timestamp", "Event Type", "Status", "Source", "Actor", "Notes"]
    rows: list[list[str]] = []
    for doc in docs:
        ts = str(doc.get("timestamp", ""))[:19]
        rows.append([
            ts,
            doc.get("event_type", doc.get("event", "-")),
            doc.get("status", "-"),
            doc.get("event_source", "-"),
            doc.get("actor", "-"),
            (doc.get("notes", "-") or "-")[:60],
        ])

    print(_fmt_table(rows, headers))
    print()


def cmd_cycles(_args: argparse.Namespace) -> None:
    """Show recent trading cycle results (derived from audit_trail + positions)."""
    print(_header("=== Recent Trading Cycles ===\n"))
    limit = _args.limit or 10

    async def _fetch() -> dict[str, Any]:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=5000)
        target_db = client[settings.DATABASE_NAME]

        # Get cycle-completed events
        cursor = (
            target_db.audit_trail
            .find({"event_type": "trading_cycle_completed"})
            .sort("timestamp", -1)
            .limit(limit)
        )
        cycle_docs = await cursor.to_list(length=limit)

        # Get recent positions
        pos_cursor = target_db.positions.find().sort("created_at", -1).limit(limit)
        positions = await pos_cursor.to_list(length=limit)

        client.close()
        return {"cycles": cycle_docs, "positions": positions}

    try:
        data = asyncio.run(_fetch())
    except Exception as exc:
        print(_err(f"Failed to query database: {exc}"))
        sys.exit(1)

    cycles = data["cycles"]
    positions = data["positions"]

    if not cycles:
        print("  No completed trading cycles found in audit_trail.")
        print("  Showing recent position history instead:\n")
        if not positions:
            print("  No positions recorded.")
            return
        headers = ["Opened", "Symbol", "Status", "Entry", "P&L", "Exit Reason"]
        rows: list[list[str]] = []
        for p in positions:
            created = str(p.get("created_at", ""))[:19]
            entry = f"${float(p.get('entry_price', 0)):,.2f}" if p.get("entry_price") else "-"
            pnl = p.get("realized_pnl")
            pnl_str = f"${float(pnl):+,.2f}" if pnl is not None else "-"
            rows.append([
                created,
                p.get("symbol", "?"),
                p.get("status", "?"),
                entry,
                pnl_str,
                (p.get("exit_reason", "-") or "-")[:40],
            ])
        print(_fmt_table(rows, headers))
        print()
        return

    headers = ["Timestamp", "Impact", "Status", "Notes"]
    rows: list[list[str]] = []
    for doc in cycles:
        ts = str(doc.get("timestamp", ""))[:19]
        rows.append([
            ts,
            doc.get("impact", "-"),
            doc.get("status", "-"),
            (doc.get("notes", "-") or "-")[:50],
        ])

    print(_fmt_table(rows, headers))
    print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        prog="cli",
        description="OptionFlow Sentinel — CLI monitoring and control.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # status
    sub.add_parser("status", help="System health (MongoDB, Alpaca, LLM)")

    # positions
    sub.add_parser("positions", help="Open Alpaca positions with P&L")

    # orders
    sub.add_parser("orders", help="Recent Alpaca orders (last 20)")

    # account
    sub.add_parser("account", help="Account equity, cash, buying power")

    # clock
    sub.add_parser("clock", help="Market clock (is_open, next open/close)")

    # kill-switch
    sub.add_parser("kill-switch", help="Emergency: close ALL open positions")

    # audit
    p_audit = sub.add_parser("audit", help="Recent audit trail entries")
    p_audit.add_argument("-n", "--limit", type=int, default=20, help="Number of entries to show")

    # cycles
    p_cycles = sub.add_parser("cycles", help="Recent trading cycle results")
    p_cycles.add_argument("-n", "--limit", type=int, default=10, help="Number of cycles to show")

    args = parser.parse_args()

    dispatch = {
        "status": cmd_status,
        "positions": cmd_positions,
        "orders": cmd_orders,
        "account": cmd_account,
        "clock": cmd_clock,
        "kill-switch": cmd_kill_switch,
        "audit": cmd_audit,
        "cycles": cmd_cycles,
    }

    dispatch[args.command](args)


if __name__ == "__main__":
    main()
