const express = require("express");
const axios = require("axios");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let accessToken = "";

const navbar = `
  <nav style="display: flex; justify-content: space-around; background-color: #f0f0f0; padding: 10px;">
  <a href="/create-customer" style="text-decoration: none; color: #333; padding: 5px;">Create Customer</a>
  <a href="/view-customers" style="text-decoration: none; color: #333; padding: 5px;">View Customers</a>
  <a href="/delete-customer" style="text-decoration: none; color: #333; padding: 5px;">Delete Customer</a>
  <a href="/update-customer" style="text-decoration: none; color: #333; padding: 5px;">Update Customer</a>
  </nav>
`;

app.get("/", (req, res) => {
  res.send(`
    <form action="/authenticate" method="post" style="max-width: 300px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <label for="login" style="font-weight: bold; display: block; margin-bottom: 5px;">Login:</label>
      <input type="text" id="login" name="login" required style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">
      <label for="password" style="font-weight: bold; display: block; margin-bottom: 5px;">Password:</label>
      <input type="password" id="password" name="password" required style="width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box;">
      <button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer;">Submit</button>
    </form>
  `);
});

app.post("/authenticate", async (req, res) => {
  try {
    const { login, password } = req.body;
    const response = await axios.post(
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment_auth.jsp",
      {
        login_id: login,
        password: password,
      }
    );
    accessToken = response.data.access_token;

    res.redirect("/authenticated");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/authenticated", (req, res) => {
  res.send(`
    ${navbar}
    <h2>Successfully Authenticated</h2>
  `);
});

app.get("/home", (req, res) => {
  res.send(navbar);
});

app.get("/create-customer", (req, res) => {
  res.send(`
    ${navbar}
    <form action="/customers" method="post" style="max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <label for="firstName" style="font-weight: bold; display: block; margin-bottom: 5px;">First Name:</label>
      <input type="text" id="firstName" name="first_name" required style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="lastName" style="font-weight: bold; display: block; margin-bottom: 5px;">Last Name:</label>
      <input type="text" id="lastName" name="last_name" required style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="street" style="font-weight: bold; display: block; margin-bottom: 5px;">Street:</label>
      <input type="text" id="street" name="street" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="address" style="font-weight: bold; display: block; margin-bottom: 5px;">Address:</label>
      <input type="text" id="address" name="address" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="city" style="font-weight: bold; display: block; margin-bottom: 5px;">City:</label>
      <input type="text" id="city" name="city" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="state" style="font-weight: bold; display: block; margin-bottom: 5px;">State:</label>
      <input type="text" id="state" name="state" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="email" style="font-weight: bold; display: block; margin-bottom: 5px;">Email:</label>
      <input type="email" id="email" name="email" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="phone" style="font-weight: bold; display: block; margin-bottom: 5px;">Phone:</label>
      <input type="text" id="phone" name="phone" style="width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box;">

      <button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer;">Create Customer</button>
    </form>
  `);
});

app.post("/customers", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      street,
      address,
      city,
      state,
      email,
      phone,
    } = req.body;

    const customerResponse = await axios.post(
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      {
        first_name: first_name,
        last_name: last_name,
        street: street,
        address: address,
        city: city,
        state: state,
        email: email,
        phone: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "create",
        },
      }
    );

    if (customerResponse.status === 201) {
      res.status(201).send(`
        ${navbar}
        Successfully Created
      `);
    } else {
      res.status(400).send(`
        ${navbar}
        First Name or Last Name is missing
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      ${navbar}
      Internal Server Error
    `);
  }
});

app.get("/view-customers", async (req, res) => {
  try {
    const customerListResponse = await axios.get(
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "get_customer_list",
        },
      }
    );

    const customerList = customerListResponse.data;

    if (customerList.length === 0) {
      res.send("<h2>No customers found</h2>");
      return;
    }

    const keys = Object.keys(customerList[0]);
    let tableHtml = navbar;
    tableHtml += "<h2>Customer List</h2><table border='1'><tr>";
    keys.forEach((key) => {
      tableHtml += `<th>${key}</th>`;
    });
    tableHtml += "</tr>";

    customerList.forEach((customer) => {
      tableHtml += "<tr>";
      keys.forEach((key) => {
        tableHtml += `<td>${customer[key]}</td>`;
      });
      tableHtml += "</tr>";
    });

    tableHtml += "</table>";

    res.send(tableHtml);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/delete-customer", (req, res) => {
  res.send(`
    ${navbar}
    <form action="/deleted-customer" method="post" style="max-width: 300px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <label for="uuid" style="font-weight: bold; display: block; margin-bottom: 5px;">Customer UUID:</label>
      <input type="text" id="uuid" name="uuid" required style="width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box;">
      <button type="submit" style="background-color: #ff4500; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer;">Delete Customer</button>
    </form>
    `);
});

app.post("/deleted-customer", async (req, res) => {
  try {
    const { uuid } = req.body;
    const deleteResponse = await axios.post(
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      null,
      {
        first_name: first_name,
        last_name: last_name,
        street: street,
        address: address,
        city: city,
        state: state,
        email: email,
        phone: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "delete",
          uuid: uuid,
        },
      }
    );

    if (deleteResponse.status === 200) {
      res.status(200).send(`
        ${navbar}
        Successfully Deleted
      `);
    } else if (deleteResponse.status === 400) {
      res.status(400).send(`
        ${navbar}
        UUID not found
      `);
    } else {
      res.status(500).send(`
        ${navbar}
        Error. Not Deleted
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      ${navbar}
      Internal Server Error
    `);
  }
});

app.get("/update-customer", (req, res) => {
  res.send(`
    ${navbar}
    <form action="/update-customer" method="post" style="max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
      <label for="uuid" style="font-weight: bold; display: block; margin-bottom: 5px;">Customer UUID:</label>
      <input type="text" id="uuid" name="uuid" required style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="firstName" style="font-weight: bold; display: block; margin-bottom: 5px;">First Name:</label>
      <input type="text" id="firstName" name="first_name" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="lastName" style="font-weight: bold; display: block; margin-bottom: 5px;">Last Name:</label>
      <input type="text" id="lastName" name="last_name" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="street" style="font-weight: bold; display: block; margin-bottom: 5px;">Street:</label>
      <input type="text" id="street" name="street" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="address" style="font-weight: bold; display: block; margin-bottom: 5px;">Address:</label>
      <input type="text" id="address" name="address" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="city" style="font-weight: bold; display: block; margin-bottom: 5px;">City:</label>
      <input type="text" id="city" name="city" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="state" style="font-weight: bold; display: block; margin-bottom: 5px;">State:</label>
      <input type="text" id="state" name="state" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="email" style="font-weight: bold; display: block; margin-bottom: 5px;">Email:</label>
      <input type="email" id="email" name="email" style="width: 100%; padding: 8px; margin-bottom: 10px; box-sizing: border-box;">

      <label for="phone" style="font-weight: bold; display: block; margin-bottom: 5px;">Phone:</label>
      <input type="text" id="phone" name="phone" style="width: 100%; padding: 8px; margin-bottom: 15px; box-sizing: border-box;">

      <button type="submit" style="background-color: #3366cc; color: white; padding: 10px 15px; border: none; border-radius: 3px; cursor: pointer;">Update Customer</button>
    </form>
    `);
});

app.post("/update-customer", async (req, res) => {
  try {
    const {
      uuid,
      first_name,
      last_name,
      street,
      address,
      city,
      state,
      email,
      phone,
    } = req.body;

    const updateResponse = await axios.post(
      "https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp",
      {
        first_name: first_name,
        last_name: last_name,
        street: street,
        address: address,
        city: city,
        state: state,
        email: email,
        phone: phone,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          cmd: "update",
          uuid: uuid,
        },
      }
    );

    if (updateResponse.status === 200) {
      res.status(200).send(`
        ${navbar}
        Successfully Updated
      `);
    } else if (updateResponse.status === 400) {
      res.status(400).send(`
        ${navbar}
        Body is Empty
      `);
    } else if (updateResponse.status === 500) {
      res.status(500).send(`
        ${navbar}
        UUID not found
      `);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(`
      ${navbar}
      Internal Server Error
    `);
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
