const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');

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

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
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
                date: new Date(args.eventInput.date), //new Date().toISOString()
                creator: '5cc5da90cfb52618ad8e1905'
            });

            let createdEvent;
            return event.save().then(result => {
                console.log(result._doc);
                createdEvent = { ...result._doc };
                return User.findById('5cc5da90cfb52618ad8e1905');
            }).then(user => {
                if (!user){
                    throw new Error('No user here!');
                }
                user.createdEvents.push(event);
                return user.save();
            }).then(result => {
                return createdEvent;
            }).catch(error => {
                console.log(error);
                return error;
            });

        },
        createUser: args => {
            return User.findOne({ email: args.userInput.email }).then(user => {
                if (user){
                    throw new Error('Surprise Mothafuka! User exists already!');
                }

                return bcrypt.hash(args.userInput.password, 12);
            }).then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });

                return user.save();
            }).then(result => {
                console.log(result._doc);
                return { ...result._doc, password: null }; 
            }).catch(error => {
                throw error;
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


