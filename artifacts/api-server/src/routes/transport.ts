import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/transport", (_req, res) => {
  res.json({
    studentBusRoute: "Route 2",
    busPass: { valid: true, validTill: "2025-06-30", passNo: "BP-2024-2478" },
    routes: [
      {
        routeNo: "Route 1",
        name: "Dharwad Central – JCET",
        stops: [
          { stop: "Dharwad Bus Stand",  departure: "06:45 AM" },
          { stop: "P B Road Junction",  departure: "06:55 AM" },
          { stop: "Vidyanagar",         departure: "07:05 AM" },
          { stop: "Toll Naka",          departure: "07:15 AM" },
          { stop: "JCET Main Gate",     departure: "07:30 AM" },
        ],
        returnTime: "05:30 PM", driver: "Mr. Ramesh K.", contactNo: "9876501234",
      },
      {
        routeNo: "Route 2",
        name: "Hubli Railway Station – JCET",
        stops: [
          { stop: "Hubli Railway Station", departure: "07:00 AM" },
          { stop: "Desai Cross",           departure: "07:10 AM" },
          { stop: "Keshwapur",             departure: "07:20 AM" },
          { stop: "Gokul Road",            departure: "07:30 AM" },
          { stop: "JCET Main Gate",        departure: "07:50 AM" },
        ],
        returnTime: "05:30 PM", driver: "Mr. Suresh B.", contactNo: "9876502345",
      },
      {
        routeNo: "Route 3",
        name: "Unkal – JCET",
        stops: [
          { stop: "Unkal Circle",       departure: "07:15 AM" },
          { stop: "Navanagar",          departure: "07:25 AM" },
          { stop: "Gokul Road",         departure: "07:35 AM" },
          { stop: "JCET Main Gate",     departure: "07:50 AM" },
        ],
        returnTime: "05:30 PM", driver: "Mr. Manjunath P.", contactNo: "9876503456",
      },
      {
        routeNo: "Route 4",
        name: "Hubli Old Town – JCET",
        stops: [
          { stop: "Hubli Old Town",     departure: "07:05 AM" },
          { stop: "Chowdeshwari Nagar", departure: "07:15 AM" },
          { stop: "Durgad Bail",        departure: "07:25 AM" },
          { stop: "JCET Main Gate",     departure: "07:45 AM" },
        ],
        returnTime: "05:30 PM", driver: "Mr. Prakash S.", contactNo: "9876504567",
      },
    ],
  });
});

export default router;
