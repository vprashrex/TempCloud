from environs import Env

env = Env()
env.read_env()

DATABASE_URI = env.str("DATABASE_URL")