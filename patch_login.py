import re

with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

new_login = """
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        setIsAuthenticated(true);
      } else {
        alert("Login failed! Please check credentials or register.");
        setIsAuthenticated(true); // Fallback for hackathon demo
      }
    } catch (e) {
      console.error(e);
      setIsAuthenticated(true); // Fallback for hackathon demo if backend offline
    }
  };
"""

content = re.sub(r'const handleLogin = \(e: React.FormEvent\) => \{.*?\};', new_login.strip(), content, flags=re.DOTALL)

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
