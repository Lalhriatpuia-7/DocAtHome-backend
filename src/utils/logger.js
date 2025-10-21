// import winston from "winston";
// import { createLogger, error, format, transports } from "winston";
// import 'winston-daily-rotate-file';

import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Daily rotating log file setup
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d", // keep logs for 14 days
});

// Winston logger configuration
const logger = winston.createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    fileRotateTransport, // Log to files
  ],
});

export default logger;


// const { combine, timestamp, printf, colorize, errors } = winston.format;

// const logFormat = printf(({ level, message, timestamp }) => {
//   return `${timestamp} [${level}]: ${message}`;
// });

// const dailyRotateFileTransport = new transports.DailyRotateFile({
//   filename: "logs/application-%DATE%.log",
//   datePattern: "YYYY-MM-DD",
//     zippedArchive: true,
//     maxSize: "20m",
//     maxFiles: "14d",
// });

// export const logger = createLogger({
//   level: "info",
//   format: combine(
//     colorize(),
//     timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
//     errors({ stack: true }), // to log error stack
//     logFormat
//   ),
//   transports: [
//     new winston.transports.Console(),
//     dailyRotateFileTransport, 
// ],
// }); 


