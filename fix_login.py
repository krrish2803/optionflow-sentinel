import re

with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

bad_login = """
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
"""

good_login = """
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
"""

content = content.replace(bad_login.strip(), good_login.strip())

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
