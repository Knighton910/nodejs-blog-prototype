var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/node-blog')

router.get('/show/:id', function(req,res, next){
  var posts = db.get('posts');
  posts.findById(req.params.id, function(err,post) {
    res.render('show',{
      'post': post
    })
  });
  //findById is pulling from the monk dependecy
})

router.get('/add', function(req,res,next) {

  // adding categories from db to display on UI
  var categories = db.get('categories');

  categories.find({},{}, function(err, categories) {
      res.render('addpost',{
        'title': 'Add Post',
        'categories': categories
      })
  });
});


router.post('/add',function(req,res,next) {
  // get form values
  var title     = req.body.title;
  var category      = req.body.category;
  var body      = req.body.body;
  var author    = req.body.author;
  var date      = new Date();

  if(req.files.mainimage) {
    var mainImageOriginalName   = req.files.mainimage.originalname;
    var mainImageName           = req.files.mainimage.name; //will be submited to DB
    var mainImageMime           = req.files.mainimage.mimetype;
    var mainImagePath           = req.files.mainimage.path;
    var mainImageExt            = req.files.mainimage.extension;
    var mainImageSize           = req.files.mainimage.size;
  }else{
    var mainImageName  = 'noimage.png';
  }
  // form validation
  req.checkBody('title','Title field is required').notEmpty();
  req.checkBody('body', 'Body field is required');

  //check errors
  var errs = req.validationErrors()

  if(errs) {
    res.render('addpost', {
      'errs': errs,
      'title': title,
      'body': body
    });
  }else {
    var posts = db.get('posts');

    // submit to db
    posts.insert({
      'title': title,
      'body': body,
      'category': category,
      'date': date,
      'author': author,
      'mainimage': mainImageName
    }, function(err, post) {
      if(err) {
        res.send('There was an issue submiting this post. ')
      }else{
        req.flash('success', 'Post submited')
        res.location('/');
        res.redirect('/');
      }
    })
  }
})


router.post('/addcomment',function(req,res,next) {
  // get form values
  var name    = req.body.name;
  var email      = req.body.email;
  var body      = req.body.body;
  var postid    = req.body.postid
  var commentdate      = new Date();

  // form validation
  req.checkBody('name','Name field is required').notEmpty();
  req.checkBody('email', 'Email is not formatted correctly').isEmail();
  req.checkBody('email', 'Email field is required').notEmpty();
  req.checkBody('body', 'Body field is required').notEmpty();

  //check errors
  var errs = req.validationErrors()

  if(errs) {
    var posts = db.get('posts')
    posts.findById(postid, function(err,post) {
      res.render('show', {
        'errs': errs,
        'post': post
      });
    })

  }else {
    var comment = {"name": name, "email": email, "body": body, "commentdate": commentdate}
    var posts = db.get('posts');

    posts.update({
      "_id": postid
    },
    { $push: {
      "comments": comment
    }
  },
    function(err, doc) {
        if(err) {
          throw err;
        }else {
          req.flash('success', 'Comment Added');
          res.location('/posts/show/' +postid);
          res.redirect('/posts/show/' +postid);
        }
    }
  );
  }
})

module.exports = router;
