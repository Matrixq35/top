from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

# Обработчик команды /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Указываем URL вашего Mini App (обязательно HTTPS)
    web_app_info = WebAppInfo(url="https://ugaday-chislo-5tx1hgryd-adgdgs-projects.vercel.app/")
    
    # Кнопка с параметром web_app для запуска приложения
    keyboard = [
        [InlineKeyboardButton("Запустить приложение", web_app=web_app_info)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Отправляем сообщение с кнопкой
    await update.message.reply_text("Нажмите кнопку ниже, чтобы запустить приложение:", reply_markup=reply_markup)

if __name__ == '__main__':
    # Замените 'YOUR_BOT_TOKEN' на токен вашего бота
    app = ApplicationBuilder().token("7622808496:AAHg0lQ7-1lOFkkjTN8Y_yfzhRROdEj9SNA").build()

    # Регистрируем обработчик команды /start
    app.add_handler(CommandHandler("start", start))

    # Запускаем бота
    app.run_polling()
