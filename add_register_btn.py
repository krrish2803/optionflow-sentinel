import re

with open("src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

register_logic = """
  const handleRegister = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            password: password,
            full_name: email.split("@")[0]
        })
      });
      
      if (response.ok) {
        alert("Registration successful! You can now log in.");
      } else {
        const errorData = await response.json();
        alert(`Registration failed: ${errorData.detail}`);
      }
    } catch (e) {
      console.error(e);
      alert("Registration failed. Backend might be offline.");
    }
  };
"""

# Insert handleRegister right above handleLogin
content = re.sub(r'  const handleLogin = async', register_logic + '\n  const handleLogin = async', content)

register_btn = """
            <div className="flex gap-2 mt-4">
                <button 
                type="submit" 
                className="flex-1 bg-cyan-neon hover:bg-cyan-400 text-darkBase font-bold rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
                >
                <Lock className="w-4 h-4" />
                Login
                </button>
                <button 
                type="button" 
                onClick={handleRegister}
                className="flex-1 bg-charcoal-700 hover:bg-charcoal-600 text-white font-bold rounded-lg px-4 py-3 flex items-center justify-center transition-colors"
                >
                Register
                </button>
            </div>
"""

# Replace the old login button
old_btn_regex = r'<button\s*type="submit"\s*className="w-full mt-4 bg-cyan-neon.*?Login to Sentinel Dashboard\s*</button>'
content = re.sub(old_btn_regex, register_btn.strip(), content, flags=re.DOTALL)

with open("src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
