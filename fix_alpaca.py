with open("backend/app/core/alpaca.py", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if line.startswith("def get_account(client: TradingClient):"):
        # check if the previous line is not a decorator (meaning it's the duplicate)
        if not new_lines[-1].startswith("@retry"):
            skip = True
    
    if skip and line.strip() == "":
        skip = False
        continue
        
    if not skip:
        new_lines.append(line)

with open("backend/app/core/alpaca.py", "w") as f:
    f.writelines(new_lines)
