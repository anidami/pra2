const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

bodyParser.urlencoded = function (param) {
    return undefined;
};
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// MongoDB connection
const dbURI = 'mongodb+srv://anida:123@cluster0.ykdoyit.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(dbURI);


// Book schema and model
const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    genre: String,
    publicationYear: Number,
    quantityAvailable: Number,
    price: Number,
});

const Book = mongoose.model('Book', bookSchema);


// User schema and model (assuming only for the purpose of this example)
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', async (req, res) => {
    try {
        const books = await Book.find();
        res.render('login', { books });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});


app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Проверка, существует ли пользователь с таким именем
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).render('error', { error: new Error('Username already exists') });
        }

        // Хеширование пароля перед сохранением в базу данных
        const hashedPassword = await bcrypt.hash(password, 10);

        // Сохранение пользователя в базу данных
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        // После успешной регистрации, перенаправляем пользователя на страницу входа
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});

// Реализация входа с проверкой идентификационных данных
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Поиск пользователя по имени
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).render('error', { error: new Error('Invalid username or password') });
        }

        // Сравнение хеша пароля
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).render('error', { error: new Error('Invalid username or password') });
        }

        // После успешного входа, перенаправляем пользователя на страницу index
        res.redirect('/index');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});

// Ваш обработчик маршрута для '/index'
app.get('/index', async (req, res) => {
    try {
        // Получите список книг из базы данных (или любой другой логики, которую вы хотите выполнить)
        const books = await Book.find();

        // Рендеринг страницы '/index' и передача переменной 'books' в шаблон
        res.render('index', { books });  // Замените 'index' на фактическое представление или шаблон, который вы хотите отобразить
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).render('error', { error: new Error('Username and password are required') });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Save the user to the database (assuming you have a User model)
        const user = new User({ username, password: hashedPassword });
        await user.save();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});
// Рендер страницы регистрации
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Рендер страницы входа
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).render('error', { error: new Error('Invalid username or password') });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).render('error', { error: new Error('Invalid username or password') });
        }

        // Перенаправление на '/index' после успешного входа
        res.redirect('/index');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});

const authenticateToken = (req, res, next) => {
    // Implement JWT authentication logic here
    next();
};

app.get('/admin', authenticateToken, async (req, res) => {
    try {
        const books = await Book.find();
        res.render('admin', { books });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});



app.get('/admin', (req, res) => {
    // Если пользователь авторизован, перенаправляем на админскую страницу
    if (userIsAuthenticated) {
        res.redirect('/admin');
    } else {
        // Иначе, отображаем страницу входа
        res.render('login');
    }
});




// Handling the delete request
app.delete('/admin/delete/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        // Delete the book by ID
        const deletedBook = await Book.findByIdAndDelete(bookId);

        if (!deletedBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Respond with a success message
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete the book' });
    }
});




// Render the form for updating a book
app.get('/admin/update/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        // Find the book by ID
        const bookToUpdate = await Book.findById(bookId);

        if (!bookToUpdate) {
            return res.status(404).render('error', { error: new Error('Book not found') });
        }

        res.render('admin-edit', { book: bookToUpdate });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});

// Handling the form submission for updating a book
app.post('/admin/update/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        // Update the book by ID
        const updatedBook = await Book.findByIdAndUpdate(bookId, req.body, { new: true });

        if (!updatedBook) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Redirect back to the admin panel
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});





// Form for adding a new book
app.get('/admin/add', (req, res) => {
    res.render('admin-add');
});

// Handling the form submission
app.post('/admin/add', async (req, res) => {
    try {
        const { title, author, genre, publicationYear, quantityAvailable, price } = req.body;

        // Validate the input (you may want to add more validation)
        if (!title || !author || !genre || !publicationYear || !quantityAvailable || !price) {
            return res.status(400).render('error', { error: new Error('All fields are required') });
        }

        // Save the new book to the database
        const newBook = new Book({ title, author, genre, publicationYear, quantityAvailable, price });
        await newBook.save();

        // Redirect back to the admin panel
        res.redirect('/admin');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { error });
    }
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: err });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});