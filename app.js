const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/event');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
    graphiql: true,
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find().then(events => {
                return events.map(event => {
                    return { ...event._doc };
                });
            }).catch(error => {
                throw error;
            });
        },
        createEvent: args => {

            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date) //new Date().toISOString()
            });

            return event.save().then(result => {
                console.log(result._doc);
                return { ...result._doc }; 
            }).catch(error => {
                console.log(error);
                return error;
            });

        }
    }
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_SERVER}/${process.env.MONGO_DATABASE}?retryWrites=true`,{ useNewUrlParser: true })
.then(() => {
    console.log('CONNECTED TO DB!');
    app.listen(3000);
}).catch(err => {
    console.log('ERROR CONNECTING TO MONGODB SERVER!');
    console.log(err);
});

/*
mutation {
  createEvent(eventInput: {
    title: "This is Spartha", 
    description:"Movie here", 
    price: 4.99, 
    date:"2020-04-27T18:08:04.429Z" }){
		title
  }
}
*/


