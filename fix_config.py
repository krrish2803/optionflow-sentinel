with open("backend/app/core/config.py", "r") as f:
    content = f.read()

content = content.replace("from pydantic_settings import BaseSettings", "from pydantic_settings import BaseSettings, SettingsConfigDict")
content = content.replace("    from pydantic_settings import SettingsConfigDict\n", "")

with open("backend/app/core/config.py", "w") as f:
    f.write(content)
