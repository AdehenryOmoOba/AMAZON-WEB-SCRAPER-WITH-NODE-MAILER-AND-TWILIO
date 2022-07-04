require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const accountSID = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require("twilio")(accountSID, authToken);
const nodeMailer = require("nodemailer");

const URL =
  "https://www.amazon.co.uk/all-new-echo-dot-4th-generation-smart-speaker-with-alexa-charcoal/dp/B084DWCZXZ?ref_=Oct_d_obs_d_2589474031&pd_rd_w=iCuhP&content-id=amzn1.sym.f846ee14-1ba8-4e8b-880b-8fd2aa9e3010&pf_rd_p=f846ee14-1ba8-4e8b-880b-8fd2aa9e3010&pf_rd_r=DK93QBYQY5DD3R4JHV6T&pd_rd_wg=GWin5&pd_rd_r=65c71960-5613-45db-a64d-b47e697f7b67&pd_rd_i=B084DWCZXZ";

const product = { name: "", price: "", link: "" };

const scrapeHandler = setInterval(scrape, 10000);

async function scrape() {
  // Fetch data
  const { data } = await axios.get(URL);

  //   Load html
  const $ = cheerio.load(data);

  // Extract data
  const item = $("div#dp-container");
  product.name = $(item).find("span#productTitle").text();
  product.price = parseInt(
    $(item).find("span .a-price-whole").first().text().replace(/[,.]/g, "")
  );
  product.link = URL;

  // Node mailer
  const mailTransporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const messageDetails = {
    from: process.env.SENDER_EMAIL,
    to: process.env.RECEIVER_EMAIL,
    subject: "Price Scraper Alert❗",
    text: `The price of ${product.name} is currently below ${product.price}.00 US dollars. Purchase now at ${product.link}`,
  };

  if (product.price >= 39) {
    twilioClient.messages
      .create({
        body: `The price of ${product.name} is currently below ${product.price}.00 US dollars. Purchase now at ${product.link}`,
        messagingServiceSid: "MGf45127a767dd26b397fdbfe1bce19dc6",
        from: "+17069488647",
        to: "+2348030821679",
      })
      .then((message) => console.log(message.sid))
      .done();

    mailTransporter.sendMail(messageDetails, (error) => {
      error
        ? console.log(error.message)
        : console.log(`Message sent successfully!`);
    });

    clearInterval(scrapeHandler);
    console.log(`Target price hit:`, product);
    return;
  }

  console.log(`Scraping`);
}
