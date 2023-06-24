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

const scopes = ["https://www.googleapis.com/auth/calendar"];

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
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
  await calendar.events.insert({
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

  res.send({
    msg: "done check calendar",
  });
});

app.post("/notifications", express.json(), (req, res) => {
  console.log("Received notification: ", req.body);
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
      address: "https://8733-188-163-77-104.ngrok-free.app/notifications", // URL вашего приложения, который будет получать уведомления
      params: { ttl: "86400" }, // время жизни подписки в секундах (1 день)
    },
  });

  console.log("Watch response", watchResponse);
  res.status(200).send("Watch request sent.");
});

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
