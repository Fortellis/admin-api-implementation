const schema = require('./schema.json')
const validateSchema = require('express-jsonschema').validate
const express = require('express')
const app = express()
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
app.use(bodyParser.json({extended:true}), express.json())

const JwtVerifier = require ('@okta/jwt-verifier');

const domain = 'https://identity-dev.fortellis.io';

const jwtVerifier = new JwtVerifier({
    issuer: `${domain}/oauth2/aus1ni5i9n9WkzcYa2p7`,
    assertClaims: {
        aud: "api_providers"
    }
})

app.post('/activate', [verifyToken, validateSchema({body:schema})],function(req, res){
    jwtVerifier.verifyAccessToken(req.token, "api_providers")
    .then(jwt => {
        res.set('Content-Type', 'text/html');
        console.log(jwt.claims.aud);
        //Return the minified payload that Fortellis expects to receive back.
        res.send('{"links": [{"href": "localhost:3000", "rel": "self", "method": "post", "title": "Activation Request"}]}');
        //console.log(req);
        //Get Just the request body.
        console.log('Got Body', req.body);
        console.log("The subscriptionId is " + req.body.subscriptionId);
        console.log("The connectionId is " + req.body.connectionId);
        fs.readFile('./connectionRequests.json', 'utf-8', function(err, data){
            if(err) throw err
            const arrayOfObjects = JSON.parse(data)
            arrayOfObjects.connectionRequests.push(req.body)
            console.log(arrayOfObjects)
            const writer = fs.createWriteStream('./connectionRequests.json');
            writer.write(JSON.stringify(arrayOfObjects))
        })
    })
    .catch(err => {
        res.sendStatus(403);

    })
})

app.post('/deactivate/:connectionId', [verifyToken],function(req, res){
    jwtVerifier.verifyAccessToken(req.token, "api_providers")
    .then(jwt => {
        res.set('Content-Type', 'text/html');
        console.log(jwt.claims.aud);
        //Return the minified payload that Fortellis expects to receive back.
        res.send('{"links": [{"href": "localhost:3000", "rel": "self", "method": "post", "title": "Deactivation Notification"}]}');
        console.log(req.params.connectionId);
        fs.readFile('./deactivationRequests.json', 'utf-8', function(err, data){
            if(err) throw err
            const arrayOfObjects = JSON.parse(data)
            arrayOfObjects.deactivationRequests.push(req.params)
            console.log(arrayOfObjects)
            const writer = fs.createWriteStream('./deactivationRequests.json');
            writer.write(JSON.stringify(arrayOfObjects))
        })
    })
    .catch(err => {
        res.sendStatus(403);

    })
})

app.post('/deleteRequest',(req, res)=>{
    const deleteSubscriptionId = req.body.subscriptionId;
    console.log(deleteSubscriptionId);
    fs.readFile('connectionRequests.json', 'utf-8', function(err, data){
        if(err) throw err;
        const arrayOfObjects = JSON.parse(data);
        console.log("You have requested to delete " + deleteSubscriptionId + ".");
        const newConnectionsArray = arrayOfObjects.connectionRequests.filter(connectionRequest => connectionRequest.subscriptionId !== deleteSubscriptionId);
        const writer = fs.createWriteStream('connectionRequests.json');
        writer.write("{\"connectionRequests\":" + JSON.stringify(newConnectionsArray) + "}");
        res.send({"connectionRequests": newConnectionsArray})

    })
})

app.get('/connectionRequests', (req, res)=>{
    fs.readFile('./connectionRequests.json', 'utf-8', function(err, data){
        if (err) throw err
        const arrayOfObjects = JSON.parse(data)
        console.log("You have requested refreshed information.")
        res.header("Content-Type", "application/json")
        res.send(arrayOfObjects)
    })
})

app.get('/deactivationRequests', (req, res)=>{
    fs.readFile('./deactivationRequests.json', 'utf-8', function(err, data){
        if (err) throw err
        const arrayOfObjects = JSON.parse(data)
        console.log("You have asked for your deactivations.")
        res.header("Content-Type", "application/json")
        res.send(arrayOfObjects)
    })
})

if(process.env.NODE_ENV === "production"){
    app.use(express.static('client/build'));
    app.get('*', (req,res)=>{
        res.sendFile(path.resolve(__dirname, "client", "build"))
    })
}

const PORT = process.env.PORT || 3000;

app.listen(PORT)
console.log("Node server running on port" +PORT)

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (bearerHeader) {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
        console.log("Forbidden user attempted to access the API.");
        const newConnectionsArray = arrayOfObjects.connectionRequests.filter(connectionRequest => connectionRequest.subscriptionId !== deleteSubscriptionId);
    }
}