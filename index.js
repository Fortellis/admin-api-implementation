const schema = require('./schema.json')
const validateSchema = require('express-jsonschema').validate
const express = require('express')
const app = express()
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
app.use(bodyParser.json({extended:true}), express.json())

const OktaJwtVerifier = require ('@okta/jwt-verifier');

const oktaDomain = 'https://verify-dev.fortellis.io';

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: `${oktaDomain}/oauth2`,
    assertClaims: {
        aud: "fortellis"
    }
})

app.get('/healthCheck', (req, res)=>{
    res.send({"status":"Up"})
})

app.post('/activate', [verifyToken, validateSchema({body:schema})],function(req, res){
    oktaJwtVerifier.verifyAccessToken(req.token, "fortellis")
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

app.listen(3000, '127.0.0.1')
console.log("Node server running on port 3000")

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