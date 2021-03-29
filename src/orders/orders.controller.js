const path = require("path");
const { isArray } = require("util");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function statusPropertyIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
  if (validStatus.includes(status)) {
    return next();
  }

  status === "delivered"
    ? next({
        status: 400,
        message: `A delivered order cannot be changed`,
      })
    : next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
      });
}

const orderExists = (req, res, next) => {
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder === undefined) {
    return next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
  res.locals.order = foundOrder;
  next();
};

const orderIsValid = (req, res, next) => {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;

  let problemArea = [];
  if (deliverTo === undefined || deliverTo === "") {
    problemArea.push("deliverTo");
  }
  if (mobileNumber === undefined || mobileNumber === "") {
    problemArea.push("mobileNumber");
  }
  if (dishes === undefined || !Array.isArray(dishes) || dishes.length === 0) {
    problemArea.push("dish");
  }

  if (problemArea.length !== 0) {
    return next({
      status: 400,
      message: `please check this following inputs: ${problemArea}`,
    });
  } else {
    dishes.forEach((dish, index) => {
      if (
        dish.quantity <= 0 ||
        !dish.quantity ||
        !Number.isSafeInteger(dish.quantity)
      ) {
        return next({
          status: 400,
          message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        });
      }
    });
    return next();
  }
};

function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  let newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
function read(req, res, next) {
  res.status(200).json({ data: res.locals.order });
}

function update(req, res, next) {
  let foundOrder = res.locals.order;
  const {
    data: { id, deliverTo, mobileNumber, status, dishes },
  } = req.body;
  if (id) {
    if (foundOrder.id !== id) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${foundOrder.id}, Route: ${id}`,
      });
    }
  }

  if (status)
    foundOrder = {
      ...foundOrder,
      deliverTo: deliverTo,
      mobileNumber: mobileNumber,
      status: status,
      dishes: dishes,
    };
  res.json({ data: foundOrder });
}

function destroy(req, res, next) {
  const { orderId } = req.params;

  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

// TODO: Implement the /orders handlers needed to make the tests pass

module.exports = {
  list,
  create: [orderIsValid, create],
  read: [orderExists, read],
  update: [orderExists, orderIsValid, statusPropertyIsValid, update],
  delete: [orderExists, destroy],
};
