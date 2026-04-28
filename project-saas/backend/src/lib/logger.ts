import winston from "winston";

// Définition des couleurs pour chaque niveau de log
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Format personnalisé pour les logs console
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuration des transports (Console uniquement pour le dev, on pourrait ajouter des fichiers en prod)
const transports = [
  new winston.transports.Console(),
];

// Création de l'instance du logger
const logger = winston.createLogger({
  level: "info", // Niveau minimum à logger
  format,
  transports,
});

export default logger;
