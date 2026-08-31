with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

content = content.replace("}, \\[isAuthenticated\\]\\);", "}, [isAuthenticated]);")

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
