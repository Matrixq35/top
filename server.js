const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3000

// Задайте секретный токен для административных операций (замените на свой)
const ADMIN_SECRET = 'YOUR_SECRET_TOKEN'

app.use(bodyParser.json())
app.use(express.static('public')) // для раздачи клиентской части (например, index.html)

// Подключаем или создаём базу данных
const db = new sqlite3.Database('./database.db', err => {
	if (err) {
		console.error('Ошибка подключения к БД:', err)
	} else {
		console.log('База данных подключена')
	}
})

// Создаём таблицу пользователей (если её ещё нет)
db.serialize(() => {
	db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE,
      coin_balance INTEGER DEFAULT 0
    )
  `)
})

// Эндпоинт для получения данных пользователя по telegram_id
app.get('/api/user/:telegram_id', (req, res) => {
	const telegramId = req.params.telegram_id
	db.get(
		'SELECT * FROM users WHERE telegram_id = ?',
		[telegramId],
		(err, row) => {
			if (err) {
				res.status(500).json({ error: 'Ошибка сервера' })
			} else if (!row) {
				// Если пользователь не найден — создаём нового с балансом 0
				db.run(
					'INSERT INTO users (telegram_id, coin_balance) VALUES (?, ?)',
					[telegramId, 0],
					function (err) {
						if (err) {
							res.status(500).json({ error: 'Ошибка создания пользователя' })
						} else {
							res.json({ telegram_id: telegramId, coin_balance: 0 })
						}
					}
				)
			} else {
				res.json(row)
			}
		}
	)
})

// Эндпоинт для начисления монетки (увеличиваем баланс на заданное число, по умолчанию +1)
app.post('/api/user/:telegram_id/addCoin', (req, res) => {
	const telegramId = req.params.telegram_id
	// Здесь желательно добавить проверку Telegram-авторизации, чтобы убедиться,
	// что запрос исходит от легитимного пользователя.
	const increment = req.body.increment || 1
	db.run(
		'UPDATE users SET coin_balance = coin_balance + ? WHERE telegram_id = ?',
		[increment, telegramId],
		function (err) {
			if (err) {
				res.status(500).json({ error: 'Ошибка обновления данных' })
			} else {
				// Возвращаем обновлённый баланс
				db.get(
					'SELECT coin_balance FROM users WHERE telegram_id = ?',
					[telegramId],
					(err, row) => {
						if (err) {
							res.status(500).json({ error: 'Ошибка получения данных' })
						} else {
							res.json({
								telegram_id: telegramId,
								coin_balance: row.coin_balance,
							})
						}
					}
				)
			}
		}
	)
})

// Административный эндпоинт для прямого обновления баланса (доступ только при наличии секретного токена)
app.post('/admin/user/:telegram_id/update', (req, res) => {
	const secret = req.headers['x-admin-secret']
	if (secret !== ADMIN_SECRET) {
		return res.status(403).json({ error: 'Доступ запрещён' })
	}
	const telegramId = req.params.telegram_id
	const { coin_balance } = req.body
	db.run(
		'UPDATE users SET coin_balance = ? WHERE telegram_id = ?',
		[coin_balance, telegramId],
		function (err) {
			if (err) {
				res.status(500).json({ error: 'Ошибка обновления данных' })
			} else {
				res.json({ telegram_id: telegramId, coin_balance })
			}
		}
	)
})

app.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`)
})
