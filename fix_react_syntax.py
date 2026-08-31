with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# Replace the escaped characters injected by the bad python script
content = content.replace("const \\[searchResult, setSearchResult\\] = useState<string \\| null>\\(null\\);", "const [searchResult, setSearchResult] = useState<string | null>(null);")

# Wait, the useEffect block also got escaped characters?
# Let's check:
content = content.replace("useEffect\\(\\(\\) => \\{", "useEffect(() => {")
content = content.replace("if \\(isAuthenticated\\) \\{", "if (isAuthenticated) {")
content = content.replace("fetchDashboardData\\(\\);", "fetchDashboardData();")
content = content.replace("const interval = setInterval\\(fetchDashboardData, 10000\\); // refresh every 10s", "const interval = setInterval(fetchDashboardData, 10000); // refresh every 10s")
content = content.replace("return \\(\\) => clearInterval\\(interval\\);", "return () => clearInterval(interval);")
content = content.replace("\\}", "}")
content = content.replace("\\}, \\[isAuthenticated\\]\\);", "}, [isAuthenticated]);")

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
