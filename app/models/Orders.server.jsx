import prisma from "../db.server";
// import { months } from "../utils/data";

export default class Orders {
  constructor(shop, graphql) {
    this.shopUrl = shop;
    this.graphql = graphql;
  }

  async getTicketsByOrderAndCustomerId(orderId, customerId) {
    try {
      const response = await prisma.order.findFirst({
        where: {
          orderId: `gid://shopify/Order/${orderId}`,
          customerId,
        },
        include: {
          tickets: {
            include: {
              studio: true,
              waivers: true,
            },
          },
        },
      });
      
      return response;
    } catch (e) {
      console.error("Error fetching tickets by order and customer ID:", e);
      return null;
    } 
  }

  async getAllOrders() {
    try {
      const response = await prisma.ticket.findMany({
        include: {
          order: true,
          location: true,
          studio: true,
          bookingDate: true,
          bookingTime: true,
          waivers: true,
        },
      });

      if (!response.length) {
        return {
          status: 404,
          message: "No data found",
          data: [],
        };
      }

      return {
        status: 200,
        message: "Orders fetched successfully",
        data: response,
      };
    } catch (e) {
      console.error("Error fetching tickets: ", e);
      return {
        status: 500,
        message: "Internal server error",
        data: [],
      };
    }
  }

  async markTicketsAsDownloaded(ticketIds) {
    try {
      const data = ticketIds.map((id) => ({
        ticketId: id,
        downloaded: true,
      }));

      await prisma.ticketDownload.createMany({
        data,
        skipDuplicates: true,
      });

      return {
        status: 200,
        type: "downloaded",
        data: ticketIds,
        message: "Tickets updated successfully",
      };
    } catch (e) {
      console.error("Error updating ticket download status:", e);
      return {
        status: 500,
        message: "Internal server error",
      };
    }
  }

  async getSignedWaivers(cursor = null, query = null) {
    try {
      const queryOptions = {
        where: {
          waivers: {
            some: {
              signUrl: { not: null },
            },
          },
          order: query
            ? {
                orderNumber: {
                  contains: query,
                  mode: "insensitive",
                },
              }
            : undefined,
        },
        include: {
          waivers: true,
          location: true,
          order: true,
          ticketDownload: true,
        },
        orderBy: {
          id: "asc",
        },
      };

      // Apply pagination only if no search query is provided
      if (!query) {
        queryOptions.take = 100;

        if (cursor) {
          queryOptions.skip = 1;
          queryOptions.cursor = { id: cursor };
        }
      }

      const response = await prisma.ticket.findMany(queryOptions);

      if (!response.length) {
        return {
          status: 404,
          message: "No waivers found",
          data: [],
          hasNext: false,
        };
      }

      return {
        status: 200,
        message: "Signed waivers fetched successfully",
        data: response,
        hasNext: !query && response.length === 100,
        nextCursor: !query && response.length === 100 ? response[99].id : null,
        type: query ? "search" : "pagination",
      };
    } catch (e) {
      console.error("Error fetching signed waivers: ", e);
      return {
        status: 500,
        message: "Internal server error",
        data: [],
        hasNext: false,
        nextCursor: null,
      };
    }
  }

  async getLocations() {
    return await prisma.location.findMany();
  }

  async getOrdersData() {
    try {
      const locations = await prisma.location.findMany({
        include: { studios: true },
      });
      const studios = await prisma.studio.findMany();
      const bookedDate = await prisma.bookingDate.findMany();
      const bookedTime = await prisma.bookingTime.findMany();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const parseDate = (title) => {
        const parts = title.split(" ");
        if (parts.length < 3) return null;

        const monthIndex = monthNames.indexOf(parts[1]);
        const day = parseInt(parts[2]);
        const year = today.getFullYear();

        if (monthIndex === -1 || isNaN(day)) return null;

        return new Date(year, monthIndex, day);
      };

      // Filter dates:
      const filteredBookedDate = bookedDate.filter(({ title }) => {
        const parsedDate = parseDate(title);
        if (!parsedDate) return false;

        const monthIndex = parsedDate.getMonth();

        if (monthIndex >= 7) return false;
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() - 7);

        // if () return false;

        return parsedDate.getTime() > sevenDaysFromNow.getTime();
      });

      return {
        status: 200,
        locations,
        studios,
        bookedDate,
        bookedTime,
      };
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  async getOrders(
    selectedLocationId,
    selectedTimeId,
    selectedDateId,
    selectedStudioId,
  ) {
    try {
      console.log("SW Selecte studio id", selectedStudioId);
      console.log("SW selected location  id", selectedLocationId);

      const tickets = await prisma.ticket.findMany({
        where: {
          location: {
            id: parseInt(selectedLocationId),
          },
          bookingDate: {
            id: parseInt(selectedDateId),
          },
          bookingTime: {
            id: parseInt(selectedTimeId),
          },
          studio: {
            id: selectedStudioId ? parseInt(selectedStudioId) : undefined,
          },
        },
        include: {
          order: true,
          waivers: true,
        },
      });

      if (!tickets.length) {
        return {
          status: 404,
          message: "No tickets found",
          data: [],
        };
      }

      return {
        status: 200,
        data: tickets,
        type: "tickets-fetched",
      };
    } catch (e) {
      console.error("Error fetching tickets: ", e);
      return {
        status: 500,
        message: "Internal server error",
        data: [],
      };
    }
  }

  async getOrdersShadow(
    selectedLocationId,
    selectedTimeIds,
    selectedDateIds,
    selectedStudioId,
  ) {
    try {
      console.log("Shadow Fetch - Date IDs:", selectedDateIds);
      console.log("Shadow Fetch - Time IDs:", selectedTimeIds);

      const tickets = await prisma.ticket.findMany({
        where: {
          location: {
            id: parseInt(selectedLocationId),
          },
          bookingDate: {
            id: {
              in: selectedDateIds.map((id) => parseInt(id)),
            },
          },
          bookingTime: {
            id: {
              in: selectedTimeIds.map((id) => parseInt(id)),
            },
          },
          studio: selectedStudioId
            ? {
                id: parseInt(selectedStudioId),
              }
            : undefined,
        },
        include: {
          order: true,
          waivers: true,
        },
      });

      if (!tickets.length) {
        return {
          status: 404,
          message: "No shadow tickets found",
          data: [],
        };
      }

      return {
        status: 200,
        data: tickets,
        type: "tickets-fetched",
      };
    } catch (error) {
      console.error("Shadow Fetch Error: ", error);
      return {
        status: 500,
        message: "Internal server error during shadow fetch",
        data: [],
      };
    }
  }

  async signWaiver(fullName, phone, ticketId, signUrl) {
    try {
      const data = await prisma.waiver.create({
        data: {
          fullName,
          phone,
          ticketId: parseInt(ticketId),
          signUrl,
        },
      });

      return {
        status: 200,
        message: "Waiver submit successfully",
        data,
      };
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  async getTickets() {
    try {
      const tickets = await prisma.ticket.findMany({
        include: {
          waivers: true,
        },
      });

      return {
        status: 200,
        data: tickets,
      };
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  async generateTickets(orderId, lineItems, tags, type) {
    // order-paid type when webhooks is called for order_paid
    const isOrderPaid = type === "order-paid";

    const cityTag = tags.find((tag) => tag.includes("City"));
    const studioTag = tags.find((tag) => tag.includes("Studio"));

    console.log("SW cityTag on find", cityTag);
    console.log("SW studio Tag on find ", studioTag);

    if (!cityTag || !studioTag) {
      console.log("SW no city or studio tag found");
      return;
    }

    const city = cityTag ? cityTag.split(":-")[1] : "";
    const cityStudio = studioTag ? studioTag.split(":-")[1] : "";

    console.log("SW what is city", city);
    console.log("SW what is studio", cityStudio);

    for (const lineItem of lineItems) {
      const { id, variant, title, quantity } = isOrderPaid
        ? lineItem
        : lineItem.node;
      if (!variant && !isOrderPaid) {
        continue;
      }

      if (title.includes("Gift") || title.includes("gift")) {
        // if is gift card, skip
        continue;
      }

      // let studioStr = "";
      let dateStr = "";
      let timeStr = "";
      if (isOrderPaid) {
        // studioStr = lineItem.studioStr;
        dateStr = lineItem.dateStr;
        timeStr = lineItem.timeStr;
      } else {
        const titleParts = variant.title.split("/").map((str) => str.trim());
        if (titleParts.length === 3) {
          // studioStr = titleParts[0];
          dateStr = titleParts[1];
          timeStr = titleParts[2];
        } else if (titleParts.length === 2) {
          dateStr = titleParts[0];
          timeStr = titleParts[1];
        }
      }

      if (dateStr.includes("-")) {
        let dateStrComponents = dateStr.split("-");
        dateStrComponents.shift();
        dateStr = dateStrComponents.join("").trim();
      }

      let location = await prisma.location.findFirst({
        where: {
          name: city,
        },
        include: {
          studios: true,
        },
      });

      if (!location) {
        location = await prisma.location.create({
          data: {
            name: city,
          },
        });
      }
      // if the studio already exists
      let studio = await prisma.studio.findFirst({
        where: {
          locationId: location.id,
          title: cityStudio,
        },
      });

      if (!studio) {
        studio = await prisma.studio.create({
          data: {
            title: cityStudio,
            locationId: location.id,
          },
        });
      }
      // if the bookingDate already exists
      let bookingDate = await prisma.bookingDate.findFirst({
        where: {
          title: dateStr.trim(),
        },
      });

      if (!bookingDate) {
        bookingDate = await prisma.bookingDate.create({
          data: {
            title: dateStr.trim(),
          },
        });
      }
      // if the bookingTime already exists
      let bookingTime = await prisma.bookingTime.findFirst({
        where: {
          title: timeStr.trim(),
        },
      });

      if (!bookingTime) {
        bookingTime = await prisma.bookingTime.create({
          data: {
            title: timeStr.trim(),
          },
        });
      }

      const itemId = isOrderPaid
        ? id
        : id.replace("gid://shopify/LineItem/", "");

      const ticket = await prisma.ticket.findFirst({
        where: {
          itemId,
        },
      });

      if (ticket) {
        await prisma.ticket.update({
          where: {
            id: ticket.id,
          },
          data: {
            locationId: location?.id,
            studioId: studio !== "" ? studio?.id : undefined,
          },
        });

        continue;
      }

      await prisma.ticket.create({
        data: {
          bookedDay: dateStr.trim(),
          bookedTime: timeStr,
          locationId: location?.id,
          // studioId: studio.id,
          studioId: studio !== "" ? studio.id : undefined,
          bookingDateId: bookingDate.id,
          bookingTimeId: bookingTime.id,
          itemId: isOrderPaid ? id : id.replace("gid://shopify/LineItem/", ""),
          orderId,
          qty: quantity,
        },
      });

      console.log("SW TICKET GENERATED SUCCESSFULLY");
    }
  }

  async getProductTags(productId) {
    console.log("SW productId in tags", productId);

    if (!productId || productId === "") {
      return;
    }

    try {
      let formattedProductId = productId.toString();

      if (!formattedProductId.includes("gid://shopify/Product/")) {
        formattedProductId = `gid://shopify/Product/${formattedProductId}`;
      }

      const query = `
      {
        product(id: "${formattedProductId}") {
          id
          title
          tags
        }
      }`;

      const response = await this.graphql(query);
      const data = await response.json();

      return data?.data?.product?.tags;
    } catch (error) {
      console.error("Error fetching product tags:", error);
    }
  }

  async createOrder(value) {
    try {
      const {
        orderId,
        customerId,
        firstName,
        lastName,
        email,
        status,
        createdAt,
        lineItems,
        tags,
        orderNumber,
      } = value;

      console.log("SW tags in create order", tags);

      const customerName = firstName + " " + lastName;

      const order = await prisma.order.create({
        data: {
          orderId: `gid://shopify/Order/${orderId}`,
          orderNumber,
          customerId,
          customerName,
          email,
          status,
          createdAt,
        },
      });

      await this.generateTickets(order.id, lineItems, tags, "order-paid");

      return order;
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  async fetchOrdersForAllCursors(endCursorsArray, isOldStore) {
    // Loop through all the cursors and fetch orders for each one
    for (let cursor of endCursorsArray) {
      console.log("SW what is cursor from array calling again??", cursor);
      await this.runCursorQuery(cursor, isOldStore);
    }
    return "All orders fetched successfully via cursors";
  }

  async fetchAllOrdersInChunks(lastId) {
    // let lastId = 42845; // 👈 starting point
    const chunkSize = 250;
    // const chunkSize = 2;

    while (true) {
      const orders = await prisma.order.findMany({
        take: chunkSize,
        ...(lastId
          ? {
              skip: 1,
              cursor: { id: lastId },
            }
          : {}),
        orderBy: {
          id: "desc",
        },
      });

      for (const order of orders) {
        const orderId = order.orderId.replace("gid://shopify/Order/", "");
        await this.generateResult(orderId);
      }

      if (orders.length === 0) break;

      lastId = orders[orders.length - 1].id;
    }
  }

  async fetchOrdersByChunks(lastId) {
    await this.fetchAllOrdersInChunks(lastId);
  }

  async fetchOrders(type) {
    try {
      const isOldStore = type === "old-store";

      await this.fetchAllOrdersInChunks();

      // await this.generateTicketsIfNotExists();

      // await this.saveMissingOrdersById();

      // this.endCursorsArray = [];

      // await this.runQueryForUnfulfilledOrders();

      // console.log("SW total cursors to be refetched", this.endCursorsArray.length);

      const cursors = [
        "eyJsYXN0X2lkIjo2MTM1Mjg1MzgzNTA4LCJsYXN0X3ZhbHVlIjoxNzE4OTE0NjQ3MDAwfQ==",
        "eyJsYXN0X2lkIjo2MTM3OTIyNjgzMjIwLCJsYXN0X3ZhbHVlIjoxNzE5MDk2NjU5MDAwfQ==",
        "eyJsYXN0X2lkIjo2MTQwNDg1MTczNTg4LCJsYXN0X3ZhbHVlIjoxNzE5Mjc2NzY2MDAwfQ==",
        "eyJsYXN0X2lkIjo2MzA5MjMxNjkwMDY4LCJsYXN0X3ZhbHVlIjoxNzI2OTQ3NDY2MDAwfQ==",
        "eyJsYXN0X2lkIjo2MzMwODg3Mjc0ODM2LCJsYXN0X3ZhbHVlIjoxNzI3NzQ2MjUxMDAwfQ==",
        "eyJsYXN0X2lkIjo2NDc4NjA5MzgzNzY0LCJsYXN0X3ZhbHVlIjoxNzMxOTU0ODk2MDAwfQ==",
        "eyJsYXN0X2lkIjo2NDg3NzY1NTQ5Mzk2LCJsYXN0X3ZhbHVlIjoxNzMyMzA0Mjg0MDAwfQ==",
        "eyJsYXN0X2lkIjo2NDkxODIwODg0MzA4LCJsYXN0X3ZhbHVlIjoxNzMyNDcyMTA5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NTE4NjkzMTAxOTA4LCJsYXN0X3ZhbHVlIjoxNzMzMzY2MDMyMDAwfQ==",
        "eyJsYXN0X2lkIjo2NTYxODExNzkyMjEyLCJsYXN0X3ZhbHVlIjoxNzM0NzI0NjgwMDAwfQ==",
        "eyJsYXN0X2lkIjo2NTcxNjMzMTgxMDEyLCJsYXN0X3ZhbHVlIjoxNzM1MzI3OTUzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NTcyOTUzNjk4NjQ0LCJsYXN0X3ZhbHVlIjoxNzM1NDIwNzc5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NTc0OTEyNTA0MTQ4LCJsYXN0X3ZhbHVlIjoxNzM1NTY4MDc4MDAwfQ==",
        "eyJsYXN0X2lkIjo2NTc3NTA4NjE0NDg0LCJsYXN0X3ZhbHVlIjoxNzM1NzYyMDc5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NTg5MTY5Nzk1NDEyLCJsYXN0X3ZhbHVlIjoxNzM2MDM0NzY4MDAwfQ==",
        "eyJsYXN0X2lkIjo2NTk2ODI1ODA5MjM2LCJsYXN0X3ZhbHVlIjoxNzM2NTMyODQyMDAwfQ==",
        "eyJsYXN0X2lkIjo2NjA3NTM0MzU4ODY4LCJsYXN0X3ZhbHVlIjoxNzM3MTY5MzQyMDAwfQ==",
        "eyJsYXN0X2lkIjo2NjEzNTI1NDYzMzgwLCJsYXN0X3ZhbHVlIjoxNzM3NTE3ODU5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NjIzMDU3MzE0MTMyLCJsYXN0X3ZhbHVlIjoxNzM4MTExMDAzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NjM3OTYwOTg2OTY0LCJsYXN0X3ZhbHVlIjoxNzM4OTEwMDQ1MDAwfQ==",
        "eyJsYXN0X2lkIjo2NjUwMTgwNzYzOTg4LCJsYXN0X3ZhbHVlIjoxNzM5NzEzNDg2MDAwfQ==",
        "eyJsYXN0X2lkIjo2NjUzMTU5MTEzMDQ0LCJsYXN0X3ZhbHVlIjoxNzM5ODk4NjA1MDAwfQ==",
        "eyJsYXN0X2lkIjo2NjU3Mzc1Njk5Mjg0LCJsYXN0X3ZhbHVlIjoxNzQwMTYwNjMxMDAwfQ==",
        "eyJsYXN0X2lkIjo2NjY0MjM2MzM1NDQ0LCJsYXN0X3ZhbHVlIjoxNzQwNjExNTM0MDAwfQ==",
        "eyJsYXN0X2lkIjo2NjcyNjc1OTYzMjIwLCJsYXN0X3ZhbHVlIjoxNzQxMTIzOTM3MDAwfQ==",
        "eyJsYXN0X2lkIjo2Njc4ODkwODA3NjM2LCJsYXN0X3ZhbHVlIjoxNzQxNDU0NjE3MDAwfQ==",
        "eyJsYXN0X2lkIjo2NjgzNTczOTQ0NjYwLCJsYXN0X3ZhbHVlIjoxNzQxNzI4MjA2MDAwfQ==",
        "eyJsYXN0X2lkIjo2Njg3OTc4MDYyMTY0LCJsYXN0X3ZhbHVlIjoxNzQxOTc1NTYzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NjkxNDczOTgxNzgwLCJsYXN0X3ZhbHVlIjoxNzQyMTQ2OTk2MDAwfQ==",
        "eyJsYXN0X2lkIjo2Njk0MTgwNzQ5NjUyLCJsYXN0X3ZhbHVlIjoxNzQyMzE2NTM3MDAwfQ==",
        "eyJsYXN0X2lkIjo2Njk2MDMyNTAyMTAwLCJsYXN0X3ZhbHVlIjoxNzQyNDM1NDY1MDAwfQ==",
        "eyJsYXN0X2lkIjo2Njk4NTEwNDgzNzk2LCJsYXN0X3ZhbHVlIjoxNzQyNTgxNzY0MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzAwMTg5MDU3MzY0LCJsYXN0X3ZhbHVlIjoxNzQyNjg0MTIyMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzAxNjkzMzM3OTQwLCJsYXN0X3ZhbHVlIjoxNzQyODAwNDk2MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzA0MTA1MzU3NjUyLCJsYXN0X3ZhbHVlIjoxNzQyOTEyNjY1MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzA1NDIxNTQ5OTA4LCJsYXN0X3ZhbHVlIjoxNzQyOTk1NDAzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzA2NjcwODYyNjc2LCJsYXN0X3ZhbHVlIjoxNzQzMDQ0MTE3MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzA4MDE0MDg4NTMyLCJsYXN0X3ZhbHVlIjoxNzQzMTI3MTMwMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzA5NDM2NDgxODc2LCJsYXN0X3ZhbHVlIjoxNzQzMjE1NjY5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzExODEwMzI2ODY4LCJsYXN0X3ZhbHVlIjoxNzQzMjkwMDU0MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzEzMjA3MDMwMTAwLCJsYXN0X3ZhbHVlIjoxNzQzMzYzNzU0MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzEzOTgxMTQxMzMyLCJsYXN0X3ZhbHVlIjoxNzQzNDE5NDQ5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE0ODQzNzI2MTY0LCJsYXN0X3ZhbHVlIjoxNzQzNDU0MTIzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE1MDk1ODEwMzg4LCJsYXN0X3ZhbHVlIjoxNzQzNDc1ODgxMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE2MTU0NzA4MzA4LCJsYXN0X3ZhbHVlIjoxNzQzNTIzNDMyMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE2NDIyNzgzMzE2LCJsYXN0X3ZhbHVlIjoxNzQzNTM0NTQyMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE2NjE1NTI0NjkyLCJsYXN0X3ZhbHVlIjoxNzQzNTQzNTkzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE2NzUxOTM3ODc2LCJsYXN0X3ZhbHVlIjoxNzQzNTUyNTMxMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE2ODI4NzQ2MDY4LCJsYXN0X3ZhbHVlIjoxNzQzNTU5NDc5MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE3NjY4OTUwMzU2LCJsYXN0X3ZhbHVlIjoxNzQzNTk3NTM4MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE4MTAxOTEzOTQwLCJsYXN0X3ZhbHVlIjoxNzQzNjEwNTI2MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE4NjMzNDc2NDM2LCJsYXN0X3ZhbHVlIjoxNzQzNjI1ODIzMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE4OTQ2Mjc5NzY0LCJsYXN0X3ZhbHVlIjoxNzQzNjM5MTIwMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE5MDg1ODA1OTA4LCJsYXN0X3ZhbHVlIjoxNzQzNjUwNjgxMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzE5ODc2NzI3MTI0LCJsYXN0X3ZhbHVlIjoxNzQzNjkwMjUwMDAwfQ==",
        "eyJsYXN0X2lkIjo2NzIwMjA0NDcyNjYwLCJsYXN0X3ZhbHVlIjoxNzQzNzA0Mjk0MDAwfQ==",
        "eyJsYXN0X2lkIjo2NzIwNDYwMDYzMDYwLCJsYXN0X3ZhbHVlIjoxNzQzNzE4NjIxMDAwfQ==",
      ];

      // await this.fetchOrdersForAllCursors(this.endCursorsArray, isOldStore);
      // await this.fetchOrdersForAllCursors(cursors, isOldStore);

      // console.log("SW what is endCursorsArray", this.endCursorsArray);

      return {
        status: 200,
        message: "Orders fetched successfully",
        type: "tickets-fetched",
      };
    } catch (e) {
      console.log("Error: ", e);
    }
  }

  async runOrderQuery(endCursor = null, isOldStore) {
    let response;
    if (endCursor) {
      response = await this.graphql(`
        query {
          orders(first: 100, after: "${endCursor}") {
            edges {
              node {
                name
                id
                cancelledAt
                createdAt
                customer {
                  id
                  firstName
                  lastName   
                  email
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      variant {
                        id
                        title
                        price
                        selectedOptions {
                          name
                          value
                        }
                      }
                    }
                  }
                }
              }
              
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `);
    } else {
      response = await this.graphql(`
        query {
          orders(first: 100) {
            edges {
              node {
                id
                name
                cancelledAt
                createdAt
                customer {
                  id
                  firstName
                  lastName   
                  email
                }
                lineItems(first: 10) {
                  edges {
                    node {
                      id
                      title
                      quantity
                      product {
                        id
                      }
                      variant {
                        id
                        title
                        price
                        selectedOptions {
                          name
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `);
    }

    const data = await response.json();
    await this.saveOrders(data, isOldStore);
    if (data?.data?.orders?.pageInfo.hasNextPage) {
      await this.runOrderQuery(
        data?.data?.orders?.pageInfo.endCursor,
        isOldStore,
      );
    }
  }

  async runCursorQuery(endCursor, isOldStore) {
    const fulfillmentStatus = "unfulfilled";
    const response = await this.graphql(`
      query {
        orders(first: 100, after: "${endCursor}", query: "fulfillment_status:${fulfillmentStatus}") {
          edges {
            node {
              name
              id
              cancelledAt
              createdAt
              customer {
                id
                firstName
                lastName
                email
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    variant {
                      id
                      title
                      price
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const data = await response.json();
    await this.saveOrders(data, isOldStore);
  }

  async runQueryForUnfulfilledOrders(endCursor = null, isOldStore) {
    let response;
    const fulfillmentStatus = "unfulfilled";

    if (endCursor) {
      response = await this.graphql(`
      query {
        orders(first: 100, after: "${endCursor}", query: "fulfillment_status:${fulfillmentStatus}") {
          edges {
            node {
              name
              id
              cancelledAt
              createdAt
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `);
    } else {
      response = await this.graphql(`
      query {
        orders(first: 100, query: "fulfillment_status:${fulfillmentStatus}") {
          edges {
            node {
              id
              name
              cancelledAt
              createdAt
              customer {
                id
                firstName
                lastName
                email
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    product {
                      id
                    }
                    variant {
                      id
                      title
                      price
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `);
    }

    const data = await response.json();
    if (!endCursor) {
      await this.saveOrders(data, isOldStore);
    }

    const hasNext = data?.data?.orders?.pageInfo.hasNextPage;
    const endCursorVal = data?.data?.orders?.pageInfo.endCursor;
    console.log("SW what is endCursorVal", endCursorVal);

    if (hasNext) {
      this.endCursorsArray.push(endCursorVal);
      await this.runQueryForUnfulfilledOrders(endCursorVal, isOldStore);
    }
  }

  async getOrderFromShopify(orderId) {
    const response = await this.graphql(`
        query {
          order(id: "${orderId}") {
              name
              id
              cancelledAt
              createdAt
              customer {
                id
                firstName
                lastName   
                email
              }
              lineItems(first: 10) {
                edges {
                  node {
                    id
                    title
                    quantity
                    variant {
                      id
                      title
                      price
                      product {
                        id
                      }
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
              
          }
        }
      `);

    const data = await response.json();

    return data?.data?.order;
  }

  async getOrdersWithNoTickets() {
    return await prisma.order.findMany({
      where: {
        tickets: {
          none: {},
        },
      },
      select: {
        id: true,
        orderId: true,
      },
    });
  }

  async generateTicketsIfNotExists() {
    const ordersWithNoTickets = await this.getOrdersWithNoTickets();

    console.log("SW total ordersWithNoTickets", ordersWithNoTickets?.length);

    if (!ordersWithNoTickets || ordersWithNoTickets.length === 0) {
      console.log("No orders found without tickets.");
      return;
    }

    for (const order of ordersWithNoTickets) {
      console.log("Order initiated for orderId", order?.orderId);
      const response = await this.getOrderFromShopify(order?.orderId);

      const { customer, lineItems, cancelledAt } = response;

      if (!customer || cancelledAt) {
        console.log("Either customer not exist or order is cancelled");
        continue;
      }

      if (!lineItems?.edges[0]?.node?.variant?.product) {
        console.log("No product found in line items");
        continue;
      }

      const tags = await this.getProductTags(
        lineItems?.edges[0]?.node?.variant?.product?.id,
      );

      console.log("SW Generating tickets for order", order?.orderId);
      await this.generateTickets(order?.id, lineItems?.edges, tags, "graphql");
    }

    console.log("SW ALL TICKETS GENERATED SUCCESSFULLY");
  }

  async generateResult(orderId) {
    const formattedOrderId = `gid://shopify/Order/${orderId}`;
    console.log("SW Order ID", formattedOrderId);

    const response = await this.getOrderFromShopify(formattedOrderId);
    const { customer, lineItems, cancelledAt } = response;

    if (!customer || cancelledAt) {
      console.log(
        "Either customer not exist or order is cancelled order NOT EXISTS",
      );
      return false;
    }

    if (!lineItems?.edges[0]?.node?.variant?.product) {
      console.log(
        "No product found in line items for order NOT EXISTS",
        formattedOrderId,
      );
      return false;
    }

    const tags = await this.getProductTags(
      lineItems?.edges[0]?.node?.variant?.product?.id,
    );

    console.log("SW Generating tickets for order", formattedOrderId);
    await this.generateTickets(
      formattedOrderId,
      lineItems?.edges,
      tags,
      "graphql",
    );
  }

  async saveMissingOrdersById() {
    const missingOrders = ["6717911138644", "6716917612884"]; // Replace with the actual order IDs

    for (const orderId of missingOrders) {
      await this.generateResult(orderId);
    }
    console.log("SW ALL TICKETS GENERATED SUCCESSFULLY for missing orders");
  }

  async saveOrders(data, isOldStore) {
    const orders = data?.data?.orders?.edges;
    // await this.generateTicketsIfNotExists();

    // await this.saveMissingOrdersById();

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i].node;
      const { id, name, customer, createdAt, lineItems, cancelledAt } = order;
      if (!customer || cancelledAt) {
        continue;
      }
      const { firstName, lastName, email } = customer;
      const customerName = firstName + " " + lastName;
      const status = cancelledAt ? "Cancelled" : "Active";

      const existingOrder = await prisma.order.findFirst({
        where: {
          orderId: id.toString(),
        },
        include: {
          tickets: true,
        },
      });

      if (!lineItems.edges[0]?.node?.product) {
        continue;
      }
      const tags = await this.getProductTags(
        lineItems.edges[0]?.node?.product?.id,
      );

      // await this.createOrder({...data, tags});

      if (!existingOrder) {
        console.log("SW creating new order", id);
        const res = await prisma.order.create({
          data: {
            orderId: id?.toString(),
            orderNumber: name,
            customerId:
              customer?.id.replace("gid://shopify/Customer/", "") || "",
            customerName,
            oldStore: isOldStore,
            email,
            status,
            createdAt,
          },
        });

        console.log("SW order created successfully", res?.orderId);

        console.log("SW Generating tickets for order", res?.orderId);
        await this.generateTickets(res?.id, lineItems?.edges, tags, "graphql");
        console.log(
          "SW TICKETS GENERATED SUCCESSFULLY for order",
          res?.orderId,
        );
      } else {
        console.log("SW Order already exists", existingOrder?.orderId);

        await this.generateTickets(
          existingOrder?.id,
          lineItems?.edges,
          tags,
          "graphql",
        );
      }
    }
  }
}
