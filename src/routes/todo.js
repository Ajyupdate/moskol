// const { Router } = require("express");

// const { mongoose } = require("mongoose");
// const express = require("express");

// const router = Router();
// const db = mongoose.connection;
// const todoSchema = new mongoose.Schema({
//   title: String,
//   id: Number,
//   completed: String,
//   startTime: String,
//   endTime: String,
//   Date: String,
// });

// const todo = mongoose.model("todo", todoSchema);

// router.get("", async (request, response) => {
//   try {
//     const todoo = await todo.find();
//     response.json(todoo);
//   } catch (error) {
//     response.status(500).json({ error: "AN error occured" });
//   }
// });

const { Router, response } = require("express");
const { connectToDb, getDb } = require("../database/db");
const { mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

// const {getDb, connectToDb} = require('./database/')

const router = Router();
const db = mongoose.connection;

const reviewSchema = new mongoose.Schema({
  name: String,
  comment: String,
  occupation: String,
  imageUrl: String,
});

router.get("", (request, response) => {
  const requestedDate = request.query.date;
  let todos = [];

  db.collection("todos")
    .find({ date: requestedDate })

    .forEach((todo) => todos.push(todo))
    .then(() => {
      response.status(200).json(todos);
    })
    .catch(() => {
      response.status(500).json({ error: "Could not fetch the tasks" });
    });
});

//   title: String,
//   id: Number,
//   completed: String,
//   startTime: String,
//   endTime: String,
//   Date: String,
// });

// POST route to add a new todo
router.post("", (request, response) => {
  const { title, startTime, endTime, date, completed } = request.body;

  if (title && startTime && endTime) {
    const originalDate = new Date(date);
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    };

    const formattedDate = originalDate.toLocaleDateString("en-US", options);

    // Create a new Date object for the current date
    const currentDate = new Date();
    let taskDate;
    // Check if the formattedDate matches today's date
    const currentFormattedDate = currentDate.toLocaleDateString(
      "en-US",
      options
    );

    const formattedYear = parseInt(formattedDate.substring(11, 16), 10);
    const formattedMonth = formattedDate.substring(4, 8);
    const formattedDay = parseInt(formattedDate.substring(8, 10), 10);

    // Extract the date components from the current date
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentFormattedDate.substring(4, 8);
    const currentDay = currentDate.getDate();

    if (
      formattedYear === currentYear &&
      formattedMonth === currentMonth &&
      formattedDay === currentDay
    ) {
      taskDate = "Today";
    } else {
      taskDate = formattedDate;
    }

    const newTodo = {
      title,
      startTime,
      endTime,
      date: formattedDate,
      completed,
    };

    db.collection("todos")
      .insertOne(newTodo)
      .then(() => {
        response.status(201).json({ message: "Todo added successfully" });
      })
      .catch(() => {
        response.status(500).json({ error: "Could not add todo" });
      });
  } else {
    response.status(400).json({ error: "Missing required fields" });
  }
});

router.patch("/:id", (request, response) => {
  const { title, startTime, endTime, date, completed } = request.body;
  const { id } = request.params;

  if (title || startTime || endTime || date || completed) {
    const originalDate = new Date(date);
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    };

    const formattedDate = originalDate.toLocaleDateString("en-US", options);

    // Create a new Date object for the current date
    const currentDate = new Date();
    let taskDate;
    // Check if the formattedDate matches today's date
    const currentFormattedDate = currentDate.toLocaleDateString(
      "en-US",
      options
    );

    const formattedYear = parseInt(formattedDate.substring(11, 16), 10);
    const formattedMonth = formattedDate.substring(4, 8);
    const formattedDay = parseInt(formattedDate.substring(8, 10), 10);

    // Extract the date components from the current date
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentFormattedDate.substring(4, 8);
    const currentDay = currentDate.getDate();

    if (
      formattedYear === currentYear &&
      formattedMonth === currentMonth &&
      formattedDay === currentDay
    ) {
      taskDate = "Today";
    } else {
      taskDate = formattedDate;
    }

    const updatedTodo = {
      title,
      startTime,
      endTime,
      date: formattedDate,
      completed,
    };

    db.collection("todos")
      .updateOne({ _id: new ObjectId(id) }, { $set: updatedTodo })
      .then((result) => {
        if (result.matchedCount === 0) {
          response.status(404).json({ error: "Todo not found" });
        } else {
          response.json({ message: "Todo updated successfully" });
        }
      })
      .catch(() => {
        response.status(500).json({ error: "Could not update todo" });
      });
  } else {
    response.status(400).json({ error: "No fields to update" });
  }
});

router.delete("/:id", (request, response) => {
  const todoId = request.params.id;

  // Check if todoId is a valid ObjectId
  if (!ObjectId.isValid(todoId)) {
    return response.status(400).json({ error: "Invalid todo ID" });
  }

  db.collection("todos")
    .deleteOne({ _id: new ObjectId(todoId) })
    .then((result) => {
      if (result.deletedCount === 1) {
        response.json({ message: "Todo deleted successfully" });
      } else {
        response.status(404).json({ error: "Todo not found" });
      }
    })
    .catch(() => {
      response.status(500).json({ error: "Could not delete todo" });
    });
});

module.exports = router;
