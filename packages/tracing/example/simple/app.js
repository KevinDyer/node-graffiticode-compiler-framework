const bent = require("bent");
const express = require("express");

const getTodos = bent("https://jsonplaceholder.typicode.com/todos/", "GET", "json");

const PORT = process.env.PORT || "8080";
const app = express();

app.get("/", async (req, res) => {
  try {
    const todo = await getTodos("1");
    res.status(200).json(todo);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(parseInt(PORT, 10), () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
