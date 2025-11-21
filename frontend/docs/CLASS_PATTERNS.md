# Class Patterns & Standards

This document defines the standard patterns for creating classes in the frontend codebase. Following these patterns ensures consistency, maintainability, and makes it easy for LLM agents to generate new code.

## Table of Contents

1. [Naming Conventions](#naming-conventions)
2. [Immutability Rules](#immutability-rules)
3. [Optional Values](#optional-values)
4. [Serialization Pattern](#serialization-pattern)
5. [Interfaces vs Types](#interfaces-vs-types)
6. [Value Objects & Equality](#value-objects--equality)
7. [Validation Strategy](#validation-strategy)
8. [Builder Pattern for Complex Objects](#builder-pattern-for-complex-objects)
9. [Complete Examples](#complete-examples)

---

## Naming Conventions

### Rule: Three-Part Naming

Every domain class should have three related types/constructs:

1. **`IClassName`** - Interface defining the runtime contract
2. **`ClassNameJSON`** - Type/interface for serialization format
3. **`ClassName`** - Class implementing `IClassName`

### Example

```typescript
// 1. Runtime interface (for mocking, type contracts)
export interface ICity {
    readonly id: string;
    readonly name: string;
    readonly lat: number;
    readonly lon: number;
    withNearestStation(stationId: string, distance: number): ICity;
    equals(other: ICity): boolean;
}

// 2. JSON serialization type (for API/Redux)
export interface CityJSON {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stationId?: string;
    distanceToStation?: number;
}

// 3. Implementation class
export class City implements ICity {
    // ... implementation
}
```

### When to Use Each

- **`IClassName`**: Use for function parameters, component props, anywhere you want to allow substitution/mocking
- **`ClassNameJSON`**: Use for Redux state, API responses, any serialized data
- **`ClassName`**: Use when you need concrete instances with methods

---

## Immutability Rules

### Rule: All Properties Are Readonly

All class properties must be declared as `public readonly`. No mutable state.

```typescript
export class City implements ICity {
    public readonly id: string;
    public readonly name: string;
    public readonly lat: number;
    public readonly lon: number;
    
    constructor(id: string, name: string, lat: number, lon: number) {
        this.id = id;
        this.name = name;
        this.lat = lat;
        this.lon = lon;
    }
}
```

### Rule: No Setters

Never expose setter methods. Use immutable update methods instead.

❌ **BAD:**
```typescript
class City {
    setName(name: string): void {
        this.name = name; // Mutation!
    }
}
```

✅ **GOOD:**
```typescript
class City {
    withName(name: string): City {
        return new City(this.id, name, this.lat, this.lon); // New instance
    }
}
```

### Rule: Use Builder Pattern for Complex Construction

For classes with many optional properties or dynamic keys, use the Builder pattern instead of setters.

See [Builder Pattern section](#builder-pattern-for-complex-objects) below.

---

## Optional Values

### Rule: Always Use `undefined`, Never `null`

For optional/missing values, always use `undefined`. Never use `null`.

❌ **BAD:**
```typescript
export interface CityJSON {
    stationId: string | null;  // Don't use null
}
```

✅ **GOOD:**
```typescript
export interface CityJSON {
    stationId?: string;  // Use optional property
}
```

### Rule: Optional Property vs `| undefined`

Prefer optional property syntax (`?:`) over explicit `| undefined` unless you need to differentiate between "absent" and "explicitly undefined".

✅ **PREFERRED:**
```typescript
interface CityJSON {
    stationId?: string;
}
```

✅ **ACCEPTABLE (when you need explicit undefined):**
```typescript
interface CityJSON {
    stationId: string | undefined;
}
```

### Handling Optional Values in Constructors

Use default parameters for optional values:

```typescript
constructor(
    id: string,
    name: string,
    lat: number,
    lon: number,
    stationId?: string,
    distanceToStation?: number
) {
    this.id = id;
    this.name = name;
    this.lat = lat;
    this.lon = lon;
    this.stationId = stationId;
    this.distanceToStation = distanceToStation;
}
```

---

## Serialization Pattern

### Rule: Always Implement `toJSON()` and `static fromJSON()`

Every class must provide bidirectional serialization.

```typescript
export class City implements ICity {
    // ... properties and constructor
    
    toJSON(): CityJSON {
        return {
            id: this.id,
            name: this.name,
            lat: this.lat,
            lon: this.lon,
            stationId: this.stationId,
            distanceToStation: this.distanceToStation,
        } satisfies CityJSON;
    }
    
    static fromJSON(json: CityJSON): City {
        return new City(
            json.id,
            json.name,
            json.lat,
            json.lon,
            json.stationId,
            json.distanceToStation,
        );
    }
}
```

### Rule: Always Use `satisfies` in `toJSON()`

Use the `satisfies` keyword to ensure type safety while preserving the exact return type.

```typescript
toJSON(): CityJSON {
    return {
        id: this.id,
        name: this.name,
        lat: this.lat,
        lon: this.lon,
    } satisfies CityJSON;  // ✅ Ensures we match CityJSON shape
}
```

---

## Interfaces vs Types

### When to Use `interface`

Use `interface` for object shapes that represent contracts:

```typescript
export interface ICity {
    readonly id: string;
    readonly name: string;
    equals(other: ICity): boolean;
}
```

### When to Use `type`

Use `type` for:
- Unions: `type Status = 'idle' | 'loading' | 'succeeded' | 'failed'`
- Primitives: `type StationId = string`
- Complex combinations: `type Result<T> = T | Error`
- Type aliases: `type CityList = CityJSON[]`

### JSON Representation: Interface or Type?

Either is acceptable for JSON types, but prefer `interface` for consistency:

✅ **PREFERRED:**
```typescript
export interface CityJSON {
    id: string;
    name: string;
}
```

✅ **ACCEPTABLE:**
```typescript
export type CityJSON = {
    id: string;
    name: string;
};
```

---

## Value Objects & Equality

### Rule: Implement `equals()` for Value Objects

Value objects (objects identified by their values, not identity) should implement an `equals()` method.

**Examples of Value Objects:**
- `DateRange` - Two date ranges are equal if dates match
- `StationData` - Equal if all temperature/humidity values match
- Coordinate pairs, measurements, etc.

**Not Value Objects (Entities):**
- `City` - Has unique `id`, identity-based
- `Station` - Has unique `id`, identity-based

```typescript
export class DateRange implements IDateRange {
    public readonly from: string;
    public readonly to: string;
    
    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;
    }
    
    equals(other: IDateRange): boolean {
        return this.from === other.from && this.to === other.to;
    }
}
```

### Entity Equality (Optional)

For entities (objects with identity), you may implement `equals()` to compare by ID:

```typescript
export class City implements ICity {
    public readonly id: string;
    // ... other properties
    
    equals(other: ICity): boolean {
        return this.id === other.id;
    }
}
```

This is optional but helpful for testing and comparisons.

---

## Validation Strategy

### Rule: Validate but Never Throw

Validation should warn about invalid data but never throw exceptions. Instead:

1. Log a warning to console
2. Return `undefined` for invalid values
3. Skip invalid objects when building collections

This prevents data quality issues from breaking the application.

### Examples

**Simple Validation in Constructor:**

```typescript
export class City implements ICity {
    public readonly lat: number;
    public readonly lon: number;
    
    constructor(id: string, name: string, lat: number, lon: number) {
        // Validate lat/lon ranges
        if (!isValidNumber(lat, -90, 90)) {
            console.warn(`Invalid latitude for city ${name}: ${lat}`);
            this.lat = 0; // Default to equator
        } else {
            this.lat = lat;
        }
        
        if (!isValidNumber(lon, -180, 180)) {
            console.warn(`Invalid longitude for city ${name}: ${lon}`);
            this.lon = 0; // Default to prime meridian
        } else {
            this.lon = lon;
        }
        
        this.id = id;
        this.name = name;
    }
}
```

**Validation in Static Factory:**

```typescript
export class City implements ICity {
    // ... constructor without validation
    
    static create(json: CityJSON): City | undefined {
        // Validate before construction
        if (!json.id || !json.name) {
            console.warn('Missing required fields for city', json);
            return undefined;
        }
        
        if (!isValidNumber(json.lat, -90, 90) || !isValidNumber(json.lon, -180, 180)) {
            console.warn(`Invalid coordinates for city ${json.name}`, json);
            return undefined;
        }
        
        return new City(json.id, json.name, json.lat, json.lon);
    }
}
```

**Validation in Service (Recommended):**

```typescript
export const fetchCities = async (): Promise<CityJSON[]> => {
    return fetchAndParseCSV('/cities.csv', (rows) => {
        const cities: CityJSON[] = [];
        
        for (const [name, latStr, lonStr] of rows) {
            const lat = parseOptionalFloat(latStr);
            const lon = parseOptionalFloat(lonStr);
            
            // Validate and skip invalid entries
            if (!name || lat === undefined || lon === undefined) {
                console.warn('Skipping invalid city entry', { name, latStr, lonStr });
                continue;
            }
            
            if (!isValidNumber(lat, -90, 90) || !isValidNumber(lon, -180, 180)) {
                console.warn(`Skipping city with invalid coords: ${name}`, { lat, lon });
                continue;
            }
            
            cities.push({ id: uuidv4(), name, lat, lon });
        }
        
        return cities;
    });
};
```

---

## Builder Pattern for Complex Objects

### When to Use Builder Pattern

Use builders for classes with:
- Many optional properties
- Dynamic keys (e.g., `{ [metric: string]: number }`)
- Complex construction logic
- Step-by-step assembly from external data

### Builder Pattern Structure

```typescript
// 1. Define the interface
export interface IRollingAverageRecord {
    readonly date: string;
    getMetric(key: string): number | undefined;
    equals(other: IRollingAverageRecord): boolean;
}

// 2. Define JSON type
export interface RollingAverageRecordJSON {
    date: string;
    [metric: string]: number | string | undefined;
}

// 3. Immutable class
export class RollingAverageRecord implements IRollingAverageRecord {
    public readonly date: string;
    private readonly metrics: Record<string, number>;
    
    constructor(date: string, metrics: Record<string, number>) {
        this.date = date;
        this.metrics = { ...metrics }; // Defensive copy
    }
    
    getMetric(key: string): number | undefined {
        return this.metrics[key];
    }
    
    equals(other: IRollingAverageRecord): boolean {
        if (this.date !== other.date) return false;
        
        const thisKeys = Object.keys(this.metrics).sort();
        const otherKeys = Object.keys((other as RollingAverageRecord).metrics).sort();
        
        if (thisKeys.length !== otherKeys.length) return false;
        if (thisKeys.some((k, i) => k !== otherKeys[i])) return false;
        
        return thisKeys.every(k => this.metrics[k] === other.getMetric(k));
    }
    
    toJSON(): RollingAverageRecordJSON {
        return {
            date: this.date,
            ...this.metrics,
        } satisfies RollingAverageRecordJSON;
    }
    
    static fromJSON(json: RollingAverageRecordJSON): RollingAverageRecord {
        const { date, ...metrics } = json;
        const validMetrics: Record<string, number> = {};
        
        for (const [key, value] of Object.entries(metrics)) {
            if (typeof value === 'number' && isFinite(value)) {
                validMetrics[key] = value;
            }
        }
        
        return new RollingAverageRecord(date, validMetrics);
    }
}

// 4. Builder class
export class RollingAverageRecordBuilder {
    private date: string = '';
    private metrics: Record<string, number> = {};
    
    setDate(date: string): this {
        if (!isValidISODate(date)) {
            console.warn(`Invalid date in builder: ${date}`);
        } else {
            this.date = date;
        }
        return this;
    }
    
    setMetric(key: string, value: number | undefined): this {
        if (value !== undefined && Number.isFinite(value)) {
            this.metrics[key] = value;
        } else if (value !== undefined) {
            console.warn(`Invalid metric value for ${key}: ${value}`);
        }
        return this;
    }
    
    build(): RollingAverageRecord | undefined {
        if (!this.date) {
            console.warn('Cannot build RollingAverageRecord without date');
            return undefined;
        }
        
        return new RollingAverageRecord(this.date, this.metrics);
    }
}
```

### Using the Builder

```typescript
const builder = new RollingAverageRecordBuilder();
builder
    .setDate('2025-11-21')
    .setMetric('tas', 15.5)
    .setMetric('tasmin', 10.2)
    .setMetric('tasmax', 20.8);

const record = builder.build();
```

---

## Complete Examples

### Simple Immutable Class

```typescript
export interface IStation {
    readonly id: string;
    readonly name: string;
    readonly elevation: number;
    readonly lat: number;
    readonly lon: number;
    equals(other: IStation): boolean;
}

export interface StationJSON {
    id: string;
    name: string;
    elevation: number;
    lat: number;
    lon: number;
}

export class Station implements IStation {
    public readonly id: string;
    public readonly name: string;
    public readonly elevation: number;
    public readonly lat: number;
    public readonly lon: number;
    
    constructor(id: string, name: string, elevation: number, lat: number, lon: number) {
        this.id = id;
        this.name = name;
        this.elevation = elevation;
        this.lat = lat;
        this.lon = lon;
    }
    
    equals(other: IStation): boolean {
        return this.id === other.id;
    }
    
    toJSON(): StationJSON {
        return {
            id: this.id,
            name: this.name,
            elevation: this.elevation,
            lat: this.lat,
            lon: this.lon,
        } satisfies StationJSON;
    }
    
    static fromJSON(json: StationJSON): Station {
        return new Station(json.id, json.name, json.elevation, json.lat, json.lon);
    }
}
```

### Value Object with Utility Methods

```typescript
export interface IDateRange {
    readonly from: string;
    readonly to: string;
    contains(date: string): boolean;
    equals(other: IDateRange): boolean;
}

export interface DateRangeJSON {
    from: string;
    to: string;
}

export class DateRange implements IDateRange {
    public readonly from: string;
    public readonly to: string;
    
    constructor(from: string, to: string) {
        this.from = from;
        this.to = to;
    }
    
    contains(date: string): boolean {
        return date >= this.from && date <= this.to;
    }
    
    equals(other: IDateRange): boolean {
        return this.from === other.from && this.to === other.to;
    }
    
    toJSON(): DateRangeJSON {
        return {
            from: this.from,
            to: this.to,
        } satisfies DateRangeJSON;
    }
    
    static fromJSON(json: DateRangeJSON): DateRange {
        return new DateRange(json.from, json.to);
    }
}
```

---

## Quick Checklist

When creating a new class, ensure:

- ✅ Defined `IClassName` interface
- ✅ Defined `ClassNameJSON` type/interface
- ✅ Class implements `IClassName`
- ✅ All properties are `public readonly`
- ✅ No setter methods (use builders or immutable update methods)
- ✅ Use `undefined` for optional values, never `null`
- ✅ Implemented `toJSON()` with `satisfies`
- ✅ Implemented `static fromJSON()`
- ✅ Implemented `equals()` if appropriate
- ✅ Validation warns but never throws
- ✅ Used builder pattern if complex construction needed

---

## See Also

- [Adding New Data Sources](./ADD_DATA_SOURCE.md)
- [Service Patterns](./PATTERNS.md)
- [Redux Slice Factory](../src/store/factories/README.md)
