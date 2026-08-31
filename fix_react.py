with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# Extract the useEffect block
import re
effect_pattern = r'  useEffect\(\(\) => \{\n    if \(isAuthenticated\) \{\n        fetchDashboardData\(\);\n        const interval = setInterval\(fetchDashboardData, 10000\); // refresh every 10s\n        return \(\) => clearInterval\(interval\);\n    \}\n  \}, \[isAuthenticated\]\);\n'

content = content.replace(effect_pattern, "")

# Insert it after the state declarations
target = r"const \[searchResult, setSearchResult\] = useState<string \| null>\(null\);"
content = re.sub(target, target + "\n\n" + effect_pattern, content)

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
