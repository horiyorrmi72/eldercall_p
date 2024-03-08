const { google } = require('googleapis');
const { OAuth2 } = google.auth;


const CREDENTIIALS = {

}

const event = {
    'summary': req.body,
    'location': null,
    'desription':"" ,
    'start': {
        'dateTime': req.body,
        'timeZone': req.body,
    },
    'end': {
        'dateTime': req.body,
        'timeZone': req.body,
    }
}