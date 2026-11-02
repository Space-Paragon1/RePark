from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str

    # Websites allowed to call the API from a browser, comma-separated, e.g.
    # "https://repark.app,http://localhost:3000". "*" allows any site.
    # The mobile app isn't a browser, so it's unaffected.
    cors_origins: str = "*"

    # The website, for links in text messages (e.g. "{site_url}/alerts").
    site_url: str = "https://re-park.vercel.app"

    # SMS fallback. Leave unset to send push only.
    # Set either a Messaging Service SID or a From number.
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_messaging_service_sid: str | None = None
    twilio_from_number: str | None = None


    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip().rstrip("/") for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
