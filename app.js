const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const _ = require('lodash')

// const items = ["Buy Food", "Cook Food", "Eat Food"];
const workItems = [];

const port = process.env.PORT || 3000;
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

mongoose.connect(process.env.MONGODB_URL)
const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('Item' , itemsSchema)

const item = new Item({
  name: 'Welcome to Todo List'
})

const item1 = new Item({
  name: 'Hit the + button to add the item'
})

const item2 = new Item({
  name: '<-- Hit this to delete an item'
})

const defaultItems = [item,item1,item2]

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const List = mongoose.model('List' , listSchema)



app.get("/", (req, res) => {

  // const date = new Date();
  // const options = {
  //   weekday: "long",
  //   day: "numeric",
  //   month: "long",
  // };

  // const day = date.toLocaleDateString("en-US", options);

  Item.find({} , (error,foundItems) =>{
    if(foundItems.length ===0){
      Item.insertMany(defaultItems , (error) =>{
        if(error){
          console.log(error)
        }else{
          console.log('Documents Inserted Sucessfullt to Database')
        }
      })
      res.render('/')
    }else{
      res.render("list", { listTitle: 'Today', listOfItems: foundItems });
    }
  })
  
});

app.get("/:customListName", (req, res) => {

  const customListName = _.capitalize(req.params.customListName)

  List.findOne({name: customListName} , (err , foundList) =>{
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save()
        res.redirect('/' + customListName)
      }else{
        //show existing list
        res.render("list", { listTitle: foundList.name, listOfItems: foundList.items });
      }
    }
  })


  
});

app.post("/", (req, res) => {
  //   console.log(req.body);
  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item({
    name: itemName
  })

  if(listName === 'Today'){
    item.save()
res.redirect('/')
  }else{
    List.findOne({name: listName} , (err , foundList) =>{
      foundList.items.push(item)
      foundList.save()
      res.redirect('/' + listName)
    })
  }


  
});

app.post('/delete' , (req,res) =>{
  const checkedItemId = req.body.checkbox
  const listName = req.body.listName

  if(listName === 'Today'){
    Item.findByIdAndRemove(checkedItemId , (err) =>{
      if(err){
        console.log(err)
      }else{
        console.log('Item deleted Successfullt from list')
        res.redirect('/')
      }
    })
  }else{
    List.findOneAndUpdate({name: listName} ,{$pull: {items: {_id: checkedItemId}}},(error , foundList) =>{
      if(!error){
        res.redirect('/' + listName)
      }
    })
  }

  
})

app.listen(port, () => {
  console.log("Server is Up on Port " + port);
});
