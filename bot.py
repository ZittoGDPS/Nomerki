import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

TOKEN = "ТВОЙ_ТОКЕН_ЗДЕСЬ"
WEB_APP_URL = "https://zittogdps.github.io/Nomerki/"

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("Зарегистрироваться в игре 🚀", web_app=WebAppInfo(url=WEB_APP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Привет! Нажми на кнопку ниже, чтобы войти в игру:", reply_markup=reply_markup)

# Этот обработчик ловит данные из игры (web_app_data)
async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = update.effective_message.web_app_data.data
    # Отправляем сообщение об успешной регистрации
    await update.message.reply_text(f"✅ Вы успешно зарегистрированы! Ваши данные: {data}")

def main():
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    print("Бот запущен...")
    app.run_polling()

if __name__ == '__main__':
    main()