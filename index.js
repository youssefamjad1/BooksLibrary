import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import path from 'path';

const app = express();
const port = 3000;

const API_URL = "https://covers.openlibrary.org/b";
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "booksproject",
  password: "freelancer2024",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Set the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views')); // process.cwd() gets the current working directory


async function checkBooks() {
  const result = await db.query("SELECT * FROM books order by id asc");
  let books = [];
  result.rows.forEach((book) => {
    books.push(book);
  });
  return books;
}

async function getCoverUrl(coverId) {
  const API_URL = "https://covers.openlibrary.org/b";
  const result1 = await axios.get(`${API_URL}/id/${coverId}-M.jpg`);
  console.log(result1.config.url);
  return result1.config.url;
}

app.get("/", async (req, res) => {
  try {
    const books = await checkBooks();
    //console.log(books);
    const coverURLs = await Promise.all(books.map(book => getCoverUrl(book.cover_id)));
    //console.log(coverURLs);
    res.render("index.ejs", {
      listBooks: books,
      coverURLs: coverURLs
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/views/new.ejs', (req, res) => {
  res.render('new'); // Renders the new.ejs file located in the 'views' directory
});
app.get('/books/:id/edit', async (req, res) => {
  // Extract the book ID from the request parameters
  const bookId = req.params.id;
  // Fetch the book information from the database based on the ID
  // Replace this with your actual database query logic
  const book = {
      id: bookId,
      // Add other book properties as needed
  };
  const result2 =await db.query(
    "SELECT * FROM books WHERE id = $1",
    [bookId]
  );
  const books = result2.rows;
  // Render the edit page template and pass the book data to it
  //res.render('edit', { book });
  res.render("edit", {
    book: books,
  });
});


app.post("/new", async (req, res) => {
//retrieving users inputs
const { title, description, date_read, rating, cover_id } = req.body;

try {
  // Insert the new book into the database
  const insertQuery = 'INSERT INTO books (title, description, date_read, rating, cover_id) VALUES ($1, $2, $3, $4, $5)';
  await db.query(insertQuery, [title, description, date_read, rating, cover_id]);
  
  res.redirect("/");
} catch (error) {
  console.error('Error inserting book:', error);
  res.status(500).send('Error adding book');
}
});



app.post('/books/:id/update', async (req, res) => {
  const bookId = req.params.id;
  const { title, description, date_read, rating, cover_id } = req.body;
  try {
    const updateQuery = `
      UPDATE books
      SET title = $1, description = $2, date_read = $3, rating = $4, cover_id = $5
      WHERE id = $6
    `;
    await db.query(updateQuery, [title, description, date_read, rating, cover_id, bookId]);
    res.redirect('/');
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).send('Error updating book');
  }
});



app.get("/books/:id/delete", async (req, res) => {
  const deleteBookId = req.params.id;; // id of item to delete  from the form
  try {
    // Update the title of the item with the specified ID in the database
    await db.query(
      "DELETE FROM books WHERE id = $1",
      [deleteBookId]
    );
    
    res.redirect("/"); // Redirect back to the homepage after successful update
  } catch (error) {
    // Handle errors appropriately
    console.error("Error occurred while deleting item:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
