import chai from "chai"; // Импорт библиотеки Chai для утверждений (assertions) в тестах
import supertest from "supertest"; // Импорт библиотеки supertest для тестирования HTTP-запросов
import sinon from "sinon"; // Импорт библиотеки sinon для создания подмен (stubs) и шпионов (spies)
import { google } from "googleapis"; // Импорт Google APIs
import { OAuth2Client } from "google-auth-library"; // Импорт клиента OAuth2 из библиотеки google-auth-library
import app from "./index.js"; // Импорт вашего Express приложения из index.js

const { expect } = chai; // Извлекаем функцию expect из библиотеки Chai для создания утверждений в тестах
const request = supertest(app); // Создаем экземпляр supertest для отправки HTTP-запросов к нашему приложению

describe("Tests for Express API", () => {
  // Определение тестового набора (suite) для нашего Express API
  let generateAuthUrlStub, getTokenStub, calendarStub; // Объявляем переменные, которые будут использоваться для хранения подмен

  beforeEach(() => {
    // Функция, которая будет выполнена перед каждым тестом в этом наборе
    // Создаем подмены для методов OAuth2Client и google.calendar
    generateAuthUrlStub = sinon.stub(OAuth2Client.prototype, "generateAuthUrl");
    getTokenStub = sinon.stub(OAuth2Client.prototype, "getToken");
    calendarStub = sinon.stub(google, "calendar").returns({
      events: {
        insert: sinon.stub().resolves({}), // Подмена возвращает пустой объект при вызове
        list: sinon.stub().resolves({ data: { items: [] } }), // Подмена возвращает объект с пустым массивом при вызове
        watch: sinon.stub().resolves({}), // Подмена возвращает пустой объект при вызове
      },
    });
  });

  afterEach(() => {
    // Функция, которая будет выполнена после каждого теста в этом наборе
    sinon.restore(); // Восстанавливаем оригинальные методы после тестирования
  });

  it("GET /google - should redirect to Google auth URL", async () => {
    // Определение теста
    generateAuthUrlStub.returns("http://google.com/auth/url"); // Устанавливаем возвращаемое значение для подмены

    const res = await request.get("/google"); // Делаем GET-запрос к /google
    expect(res.status).to.equal(302); // Проверяем, что статус ответа равен 302
    expect(res.headers.location).to.equal("http://google.com/auth/url"); // Проверяем, что в ответе есть редирект на правильный URL
  });

  it("GET /google/redirect - should get token and set credentials", async () => {
    getTokenStub.resolves({ tokens: "test_token" }); // Устанавливаем возвращаемое значение для подмены getToken

    const res = await request
      .get("/google/redirect")
      .query({ code: "test_code" }); // Делаем GET-запрос к /google/redirect с query параметром code
    expect(res.status).to.equal(200); // Проверяем, что статус ответа равен 200
    expect(res.body).to.deep.equal({ msg: "Success sex" }); // Проверяем, что тело ответа содержит ожидаемые данные
  });

  it("GET /schedule_event - should schedule an event", async () => {
    const res = await request.get("/schedule_event"); // Делаем GET-запрос к /schedule_event
    expect(res.status).to.equal(200); // Проверяем, что статус ответа равен 200
    expect(res.body).to.deep.equal({ msg: "done check calendar" }); // Проверяем, что тело ответа содержит ожидаемые данные
  });

  it("POST /notifications - should receive notifications", async () => {
    const res = await request.post("/notifications"); // Делаем POST-запрос к /notifications
    expect(res.status).to.equal(200); // Проверяем, что статус ответа равен 200
  });

  it("GET /watch-calendar - should send watch request", async () => {
    const res = await request.get("/watch-calendar"); // Делаем GET-запрос к /watch-calendar
    expect(res.status).to.equal(200); // Проверяем, что статус ответа равен 200
    expect(res.text).to.equal("Watch request sent."); // Проверяем, что тело ответа содержит ожидаемый текст
  });
});
