//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//connect to your mongodb and create a database named todolistDB if it doesn't exisit
mongoose.connect("mongodb+srv://admin-tegajunior:tegajunior@cluster0-6lxyd.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
const day = date.getDate();
// mongoose schema
const itemsSchema = {
  name: String
};
// mongoose model
const Item = mongoose.model("Item", itemsSchema);

//creat default items using the Item model
const item1 = new Item({
  name: "Welcome to the todo list"
});
const item2 = new Item({
  name: "Click the + button to add new item"
});
const item3 = new Item({
  name: "Click <-- to delete items from the list"
});
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  //reading database documents using mongoose
  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        //  insert the 3 items into the Item models/collection
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("successfully inserted default items into the DB");
          }
        });
        res.redirect("/");

      } else {
        res.render("list", {
          listTitle: day,
          newListItems: foundItems
        });
      }
    }
  });

});

//create a new list document using express routing parameters
app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new a list
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        //show exisiting list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    } else {
      console.log(err);
    }
  } );

});
// catch the post request from the "/" route
app.post("/", function(req, res) {

  const newItem = _.capitalize(req.body.newItem);
  const listTitle = req.body.list;

  const item = new Item({
    name: newItem
  });
  if (listTitle === day) {
    //if the post request is from the default list, we just save the added item
    //...and redirect to the home route, which will now render it.
    item.save();
    res.redirect("/");
  } else {
    //if the post request is coming from any of the custom list, find it using the
    //...the name key and add the item to it's items field (which is an array of items)
    List.findOne({name: listTitle}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listTitle);
    });
  }
});

  //catch the post request from the "/delete" route
app.post("/delete", function(req, res) {
  //getting the value of the checkbox and the list name
  const clickedItemId = req.body.checkbox;
  const listName = req.body.listName;
    if (listName === day) {
      //this is coming from the default items lists, so we just find
      //...the particular list and remove it
      Item.findByIdAndRemove(clickedItemId, function(err) {
        if (!err) {
          console.log("successfully deleted Item");
        } else {
          console.log(err);
        }
      });
      res.redirect("/");
    } else {
      //this post request is from one of the custom lists
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: clickedItemId}}}, function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
    }
});


app.get("/about", function(req, res) {
  res.render("about");
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started successfully");
});
