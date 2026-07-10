# Irrigation System 🌱💧

Un sistema web completo para la gestión y monitoreo de riego. Este proyecto está construido con una arquitectura Cliente-Servidor (API RESTful), separando la interfaz de usuario de la lógica de negocio y la base de datos.

## 🗺️ Arquitectura y Estructura

El proyecto es un monorepositorio que contiene dos partes principales:

*   **`client/` (Frontend):** Interfaz de usuario interactiva y consumo de la API.
*   **`api/` (Backend):** Lógica del servidor, endpoints REST y conexión a la base de datos.

## 🛠️ Tecnologías Utilizadas

**Backend:**
*   **Java**
*   **Spring Boot** (Spring Web)
*   **Spring Data JPA** (Mapeo objeto-relacional / ORM)
*   **MySQL** (Base de datos relacional)
*   *Lombok & Spring Boot DevTools*

**Frontend:**
*   **React** (Inicializado con Create React App)
*   **Node.js & npm** (Entorno y gestor de paquetes)
*   **JavaScript / HTML / CSS**

---

## 🚀 Cómo ejecutar el proyecto localmente

Para probar este proyecto en tu computadora, asegúrate de tener instalados Node.js, Java JDK y un servidor de MySQL local (como XAMPP o MySQL Workbench).

### 1. Configurar e Iniciar el Backend
1. Abre la carpeta del backend en tu editor (ej. Visual Studio Code).
2. En la ruta `src/main/resources/application.properties`, configura las credenciales de tu base de datos MySQL local:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/nombre_de_tu_db
   spring.datasource.username=tu_usuario
   spring.datasource.password=tu_contraseña
   # Opcional: Para que JPA cree las tablas automáticamente
   spring.jpa.hibernate.ddl-auto=update