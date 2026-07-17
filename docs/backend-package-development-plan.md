# Backend package development plan

This plan completes the missing backend layers for the irrigation system using the existing models and DTOs.

## 1. Create the repository layer

Package: `api/src/main/java/com/legrandc/irrigation_system/repository`

Tasks:
- Create a repository interface for each entity:
  - `SectorRepository`
  - `IrrigationConfigurationRepository`
  - `IrrigationHistoryRepository`
- Make each interface extend `JpaRepository<Entity, Long>`.
- Add a few useful query methods for the API flow:
  - `findBySectorId(Long sectorId)` for configurations and history

Deliverable:
- Data access layer ready for service classes to use.

## 2. Define the service contracts

Package: `api/src/main/java/com/legrandc/irrigation_system/services`

Tasks:
- Create interfaces for the three main domains:
  - `SectorService`
  - `IrrigationConfigurationService`
  - `IrrigationHistoryService`
- Define CRUD methods using the existing DTOs:
  - create
  - get by id
  - get all
  - update
  - delete
- Keep method names consistent and simple, for example:
  - `createSector(SectorRequest request)`
  - `getAllSectors()`
  - `updateConfiguration(Long id, IrrigationConfigurationRequest request)`

Deliverable:
- A clean contract layer that decouples controllers from persistence logic.

## 3. Implement the service layer

Package: `api/src/main/java/com/legrandc/irrigation_system/services/impl`

Tasks:
- Create one implementation class per service interface:
  - `SectorServiceImpl`
  - `IrrigationConfigurationServiceImpl`
  - `IrrigationHistoryServiceImpl`
- Inject the corresponding repository with `@Autowired`.
- Map DTOs to entities and entities to responses.
- Handle entity-not-found scenarios with a shared exception.
- Ensure relationships are managed correctly:
  - configuration belongs to a sector
  - history belongs to a sector

Deliverable:
- Business logic fully implemented and ready to be exposed through REST endpoints.

## 4. Create the REST controllers

Package: `api/src/main/java/com/legrandc/irrigation_system/controllers`

Tasks:
- Create one controller per domain:
  - `SectorController`
  - `IrrigationConfigurationController`
  - `IrrigationHistoryController`
- Expose standard endpoints:
  - `GET /api/sectors`
  - `GET /api/sectors/{id}`
  - `POST /api/sectors`
  - `PUT /api/sectors/{id}`
  - `DELETE /api/sectors/{id}`
- Do the same for configurations and history, using the DTO request/response classes.
- Use `@Valid` for request validation.
- Return `ResponseEntity` objects for clear HTTP responses.

Deliverable:
- Fully usable API endpoints for the frontend and future testing.

## 5. Add error handling and validation

Tasks:
- Create a simple exception such as `ResourceNotFoundException`.
- Add a global exception handler with `@ControllerAdvice`.
- Return consistent error responses for:
  - not found entities
  - invalid input
  - bad requests

Deliverable:
- A more robust API with predictable behavior.

## 6. Test and verify the backend

Tasks:
- Run the application locally.
- Test the CRUD flow with Postman or curl.
- Check the database tables created by JPA.
- Run Maven tests and fix issues that appear.

Suggested verification command:
- `./mvnw test`

## Recommended implementation order

1. Repository interfaces
2. Service interfaces
3. Service implementations
4. Controllers
5. Exception handling
6. Testing and bug fixes

## Suggested package structure

- `controllers/`
- `repository/`
- `services/`
- `services/impl/`
- `exceptions/` (optional)
- `handlers/` (optional)
