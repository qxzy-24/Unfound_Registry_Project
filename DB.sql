-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: unfound_registry
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `artifact_categories`
--

DROP TABLE IF EXISTS `artifact_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_categories` (
  `artifact_id` int NOT NULL,
  `category_id` int NOT NULL,
  PRIMARY KEY (`artifact_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `artifact_categories_ibfk_1` FOREIGN KEY (`artifact_id`) REFERENCES `artifacts` (`artifact_id`) ON DELETE CASCADE,
  CONSTRAINT `artifact_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `artifact_categories`
--

LOCK TABLES `artifact_categories` WRITE;
/*!40000 ALTER TABLE `artifact_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `artifact_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artifact_images`
--

DROP TABLE IF EXISTS `artifact_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `artifact_id` int NOT NULL,
  `image_url` varchar(255) NOT NULL COMMENT 'URL to the hosted image',
  `is_primary_image` tinyint(1) DEFAULT '0' COMMENT 'To know which one to show first',
  PRIMARY KEY (`image_id`),
  KEY `artifact_id` (`artifact_id`),
  CONSTRAINT `artifact_images_ibfk_1` FOREIGN KEY (`artifact_id`) REFERENCES `artifacts` (`artifact_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `artifact_images`
--

LOCK TABLES `artifact_images` WRITE;
/*!40000 ALTER TABLE `artifact_images` DISABLE KEYS */;
INSERT INTO `artifact_images` VALUES (7,12,'/uploads/1762803710918.webp',1),(8,13,'/uploads/1762807848819.webp',1),(9,14,'/uploads/1762807978742.webp',1),(10,15,'/uploads/1762808338404.webp',1),(11,16,'/uploads/1762808614843.webp',1),(12,17,'/uploads/1762816217843.webp',1);
/*!40000 ALTER TABLE `artifact_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artifact_status`
--

DROP TABLE IF EXISTS `artifact_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifact_status` (
  `status_id` int NOT NULL AUTO_INCREMENT,
  `artifact_id` int NOT NULL,
  `status` enum('Lost','Stolen','Missing','Recovered') NOT NULL,
  `last_seen_date` date DEFAULT NULL,
  `last_seen_location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`status_id`),
  UNIQUE KEY `artifact_id` (`artifact_id`),
  CONSTRAINT `artifact_status_ibfk_1` FOREIGN KEY (`artifact_id`) REFERENCES `artifacts` (`artifact_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `artifact_status`
--

LOCK TABLES `artifact_status` WRITE;
/*!40000 ALTER TABLE `artifact_status` DISABLE KEYS */;
INSERT INTO `artifact_status` VALUES (7,12,'Recovered',NULL,'Neues Museum, Berlin, Germany'),(8,13,'Recovered',NULL,'National Archaeological Museum, Athens, Greece'),(9,14,'Stolen',NULL,'Isabella Stewart Gardner Museum, Boston, USA'),(10,15,'Stolen',NULL,'Isabella Stewart Gardner Museum, Boston, USA'),(11,16,'Missing',NULL,'Czartoryski Museum, Kraków, Poland (1945)'),(12,17,'Stolen',NULL,'Musée du Louvre, Paris, France');
/*!40000 ALTER TABLE `artifact_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `artifacts`
--

DROP TABLE IF EXISTS `artifacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `artifacts` (
  `artifact_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `artist` varchar(255) DEFAULT NULL,
  `period` varchar(100) DEFAULT NULL COMMENT 'e.g., Renaissance, 18th Century',
  `dimensions` varchar(100) DEFAULT NULL COMMENT 'e.g., 40 x 30 cm',
  `materials` varchar(255) DEFAULT NULL COMMENT 'e.g., Oil on canvas',
  `owner_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`artifact_id`),
  KEY `owner_id` (`owner_id`),
  FULLTEXT KEY `title` (`title`,`description`,`artist`,`period`),
  CONSTRAINT `artifacts_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `artifacts`
--

LOCK TABLES `artifacts` WRITE;
/*!40000 ALTER TABLE `artifacts` DISABLE KEYS */;
INSERT INTO `artifacts` VALUES (12,'Bust of Nefertiti','A painted limestone bust of Queen Nefertiti, known for its extraordinary craftsmanship and symmetry. It is one of the most iconic artifacts from Ancient Egypt.','Thutmose','1345 BCE, Amarna Period (Ancient Egypt)',NULL,NULL,2,'2025-11-10 19:41:50','2025-11-10 19:41:50'),(13,'The Mask of Agamemnon','A gold funerary mask discovered by Heinrich Schliemann, once believed to belong to the legendary king Agamemnon.','Unknown Mycenaean craftsman','1550–1500 BCE',NULL,NULL,2,'2025-11-10 20:50:48','2025-11-10 20:50:48'),(14,'The Storm on the Sea of Galilee','Rembrandt’s only seascape painting, stolen during the 1990 Gardner Museum heist and never recovered.','Rembrandt van Rijn','1633, Dutch Golden Age',NULL,NULL,2,'2025-11-10 20:52:58','2025-11-10 20:52:58'),(15,'The Concert','A rare Vermeer painting stolen in the same 1990 museum heist. Its whereabouts remain unknown despite numerous leads and investigations.','Johannes Vermeer','1664, Dutch Baroque',NULL,NULL,2,'2025-11-10 20:58:58','2025-11-10 20:58:58'),(16,'Portrait of a Young Man','Considered Raphael’s self-portrait, this masterpiece was looted by the Nazis during WWII and is still missing.','Raphael','1513, High Renaissance',NULL,NULL,2,'2025-11-10 21:03:34','2025-11-10 21:03:34'),(17,'Mona Lisa','This is the High Renaissance oil on wood panel portrait, the *Mona Lisa*, by Leonardo da Vinci (c. 1503–1506). The piece is famous for its sfumato technique, depicting a woman with a gentle expression against an atmospheric, imaginary landscape.','Leonardo da Vinci','1503–1506, Renaissance',NULL,NULL,2,'2025-11-10 23:10:17','2025-11-10 23:10:17');
/*!40000 ALTER TABLE `artifacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `user_name` varchar(100) NOT NULL COMMENT 'e.g., The Louvre Museum or J. Smith',
  `user_type` enum('institution','collector','admin') NOT NULL DEFAULT 'collector',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'curator@louvre.fr','hashed_password_placeholder','The Louvre Museum','institution','2025-11-09 18:40:21'),(2,'qqq@mail.com','$2b$10$FiLFzhFRIs.iwQ1iiH7RF.gIbVi7r94kzqG1LOGkN.pFuhmhC/L1a','qxzy','admin','2025-11-09 19:35:28'),(4,'mmm@gmail.com','$2b$10$AkEaKbGbo/5u7TxEa7mfteHx3UuxpbY.ieiffif1qyaaZFOvqTtHG','Mustafa','admin','2025-12-08 13:17:23'),(5,'aaa@gmail.com','$2b$10$7.WYZf/5Cfpi.M6SRDyb3O5yP2dmbPJzsVvMuMAJQhrBmSsSH9yn6','aaaa','admin','2025-12-09 07:34:29');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-09 15:14:16
