const express = require('express');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const cors = require('cors');


const app = express();
const port = process.env.PORT || 5000;


//firebase admin initialization
var serviceAccount = require('./genius-car-mechanic-ac740-firebase-adminsdk-7az4r-3ff1796fb6.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


app.use(cors());
app.use(express.json());

//genius-car
//RLSS06edJJjVvE5i

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken (req, res, next)
{
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];

        try {
            const decodeUser = await admin.auth().verifyIdToken(idToken);
            req.decodeUserEmail = decodeUser.email
        }
        catch {

        }
    }
    next();
};

async function run ()
{
    try {
        await client.connect();
        const database = client.db('carMechanic');
        const servicesCollection = database.collection('services');
        const orderCollection = database.collection('orders');
        //GET API
        app.get('/services', async (req, res) =>
        {
            const cursor = servicesCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });
        //GET single service
        app.get('/services/:id', async (req, res) =>
        {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await servicesCollection.findOne(query);
            res.json(service);
        })
        // POST API
        app.post('/services', async (req, res) =>
        {
            const newService = req.body;
            const result = await servicesCollection.insertOne(newService);
            res.json(result);
        });
        //DELETE API
        app.delete('/services/:id', async (req, res) =>
        {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.deleteOne(query);
            res.json(result);
        })
        //order POST API
        app.post('/orders', async (req, res) =>
        {
            const newOrders = req.body;
            const result = await orderCollection.insertOne(newOrders);
            res.json(result);
        });
        //order GET API
        app.get('/orders', verifyToken, async (req, res) =>
        {
            const email = req.query.email;
            if (req.decodeUserEmail === email) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else {
                res.status(401).json({ message: 'User not authorized' });
            };

        });
    }
    finally {

    }
};

run().catch(console.dir);

app.get('/', (req, res) =>
{
    res.send('Running Genius Car Server');
});

app.listen(port, () => { console.log('Running the port', port) });