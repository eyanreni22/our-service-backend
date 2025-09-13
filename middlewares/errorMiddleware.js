// const errorHandler = (err, req, res, next) => {
//     const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//     res.status(statusCode).json({
//       message: err.message || "Server Error",
//       stack: process.env.NODE_ENV === "production" ? null : err.stack,
//     });
//   };
  
//   module.exports = { errorHandler };
// middlewares/errorMiddleware.js

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Server Error",
  });
};

// ✅ CommonJS export
module.exports = { errorHandler };