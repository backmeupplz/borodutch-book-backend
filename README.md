# Borodutch Book backend

Backend for the Borodutch Book website

## Installation and local launch

1. Clone this repo: `git clone https://github.com/backmeupplz/borodutch-book-backend`
2. Create `.env` with the environment variables listed below
3. Run `yarn` in the root folder
4. Run `yarn start`

And you should be good to go! Feel free to fork and submit pull requests.

## Environment variables

| Name               | Description                              |
| ------------------ | ---------------------------------------- |
| `TELEGRAM_TOKEN`   | Telegram bot token for reporting         |
| `TELEGRAM_CHAT_ID` | Telegram chat id for reporting           |
| `PORT`             | Port to run server on (defaults to 1337) |

Also, please, consider looking at `.env.sample`.

# Continuous integration

Any commit pushed to `main` gets deployed to backend.book.borodutch.com via [CI Ninja](https://github.com/backmeupplz/ci-ninja).
