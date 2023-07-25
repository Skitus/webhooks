import dotenv from "dotenv";
import express from "express";
import { google } from "googleapis";
import dayjs from "dayjs";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const calendar = google.calendar({
  version: "v3",
  auth: process.env.API_KEY,
});

const app = express();

const PORT = process.env.NODE_ENV || 8000;

let lastCheckTime = new Date();
let newItemsForToday = [];

const scopes = ["https://www.googleapis.com/auth/calendar"];

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${process.env.API_URL}/google/redirect`
);

app.use(bodyParser.json());

app.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  res.redirect(url);
});

app.get("/google/redirect", async (req, res) => {
  const code = req.query.code;

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  res.send({
    msg: "Success sex",
  });
});

app.get("/schedule_event", async (req, res) => {
  const calendarEvent = await calendar.events.insert({
    calendarId: "primary",
    auth: oauth2Client,
    requestBody: {
      summary: "This is a test event",
      description: "Very important meet",
      start: {
        dateTime: dayjs(new Date()).add(1, "day").toISOString(),
        timeZone: "Europe/Kiev",
      },
      end: {
        dateTime: dayjs(new Date()).add(1, "day").add(1, "hour").toISOString(),
        timeZone: "Europe/Kiev",
      },
    },
  });

  res
    .status(200)
    .send({
      msg: "done check calendar",
    })
    .end();
});

app.post("/notifications", express.json(), async (req, res) => {
  const resourceId = req.headers["x-goog-resource-id"];
  console.log("Received notification for resource: ", resourceId);

  let pageToken = null;
  let allEvents = [];

  do {
    console.log("pageToken", pageToken);
    const response = await calendar.events.list({
      calendarId: "primary",
      auth: oauth2Client,
      pageToken: pageToken,
    });

    allEvents = allEvents.concat(response.data.items);
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  allEvents.forEach((item) => {
    const startDate = new Date(item.start.dateTime);
    const endDate = new Date(item.end.dateTime);
    // create creation time date
    const creationTime = new Date(item.created);

    // check if item new
    if (creationTime > lastCheckTime) {
      // get data from item
      const { summary, creator } = item;
      const email = creator.email;

      console.log("New event summary: ", summary);
      console.log("Creator email: ", email);
      // add new items to array if they created today
      newItemsForToday.push(item);
    }
  });

  console.log("allEvents", allEvents.length);

  // update time from last query
  lastCheckTime = new Date();
  console.log("newItems", newItems);
  res.status(200).end();
});

app.get("/watch-calendar", async (req, res) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 1);
  const watchResponse = await calendar.events.watch({
    calendarId: "primary",
    auth: oauth2Client,
    requestBody: {
      id: uuidv4(), // уникальный идентификатор для этой подписки
      type: "web_hook",
      address: `${process.env.API_URL}/notifications`, // URL вашего приложения, который будет получать уведомления
      params: { ttl: "86400" }, // время жизни подписки в секундах (1 день)
    },
  });

  console.log("Watch response", watchResponse);
  res.status(200).send("Watch request sent.");
});

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});

export default app;
