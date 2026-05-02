## Overview

The dataset has several data quality issues that should be addressed before moving to the Silver layer.

### 1. Missing values
The most significant missing values appear in the following columns:
- `company`: 112,593 missing values (~94%)
- `agent`: 16,340 missing values
- `country`: 488 missing values
- `children`: 4 missing values

Planned handling:
- Drop `company` because it has an extremely high missing rate and provides limited analytical value.
- Investigate appropriate treatment for `agent` and `country`.
- Fill missing values in `children` with `0`, since the number of missing records is very small.

### 2. Invalid or suspicious values
Some records contain values that may be logically invalid or abnormal:
- `adults = 0` in 403 rows, which may indicate invalid booking records.
- `adr` contains abnormal values, with a minimum of `-6.38` and a maximum of `5400`.

Planned handling:
- Investigate rows where `adults = 0` and remove or flag invalid records if necessary.
- Filter negative `adr` values and apply an outlier treatment strategy for extremely high values.

### 3. Non-standard data types
Some columns need type standardization:
- `reservation_status_date` is stored as a string and should be converted to a date type.
- `arrival_date_month` is stored as text and should be converted into a numeric representation (`1` to `12`) for easier analysis.

### 4. Sensitive data
The dataset contains personally identifiable information (PII), including:
- `name`
- `email`
- `phone-number`
- `credit_card`

Planned handling:
- Drop these columns in the Silver layer to protect privacy and avoid using sensitive data in analytics.

### 5. Data imbalance
Some features are highly skewed:
- Most records have `children = 0`
- Most records have `babies = 0`

This issue should be considered during feature engineering and modeling.

### 6. Duplicate records
No duplicate rows were detected in the dataset.


# 🏨 Hotel Booking Data Pipeline (Spark + HDFS)

## 📌 Overview

This project implements a data engineering pipeline using **Apache Spark** and **HDFS**, following the **Medallion Architecture (Bronze – Silver – Gold)**.

The goal is to ingest raw hotel booking data, clean and standardize it, and prepare it for analytics.

---

## 🏗️ Architecture

The data pipeline is organized into three layers:

- **Bronze Layer**: Raw data ingestion (stored as-is in HDFS)
- **Silver Layer**: Data cleaning and transformation
- **Gold Layer**: Aggregated data for analytics and reporting

        Raw Data (CSV)
              ↓
         Bronze Layer (HDFS)
              ↓
         Silver Layer (Cleaned Data)
              ↓
         Gold Layer (Analytics)

---

## 📂 Project Structure


UEL_Project/
│
├── jobs/
│ └── bronze_ingest.py
│
├── raw_data/
│ └── hotel_booking.csv
│
└── README.md


---

## 📥 Bronze Layer (Raw Ingestion)

### 🔹 Description

The Bronze layer ingests raw data from CSV and stores it in HDFS without applying business logic.

### 🔹 Key Characteristics

- All columns are stored as **string**
- Missing values are replaced with `"UNKNOWN"`
- Data is stored in **Parquet format**
- Data is written to HDFS

### 🔹 Code Logic

- Read CSV without schema inference
- Cast all columns to string
- Replace null or empty values with `"UNKNOWN"`
- Write to HDFS

### 🔹 Output Path


hdfs://localhost:9000/uel_project/bronze/hotel_booking


---

## ⚙️ Technologies Used

- **Apache Spark** (Data processing)
- **HDFS** (Distributed storage)
- **PySpark** (Python API for Spark)
- **Parquet** (Columnar storage format)

---

## 🚀 How to Run

### 1. Start Hadoop (HDFS)

```bash
start-dfs.sh
2. Run Bronze Ingestion Job
spark-submit ~/UEL_Project/jobs/bronze_ingest.py
3. Verify Data in HDFS
hdfs dfs -ls /uel_project/bronze/hotel_booking

## 🥈 Silver Layer – Data Cleaning & Standardization

### 📌 Overview

The Silver layer is responsible for cleaning and transforming the raw data from the Bronze layer into a structured and analysis-ready format.

At this stage, the data is standardized, missing values are handled appropriately, and data types are corrected.

---

## 🎯 Objectives

- Convert raw string data into proper data types
- Handle missing and invalid values
- Preserve data quality information
- Prepare data for analytics (Gold layer)

---

## 🔄 Data Flow


Bronze (Raw Data - String)
↓
Silver (Cleaned & Structured Data)


---

## 🧹 Data Cleaning Strategy

### 1. Handling Missing Values

- In the Bronze layer, missing values are stored as `"UNKNOWN"`
- In the Silver layer:

| Column Type     | Strategy |
|----------------|---------|
| Categorical    | Keep `"UNKNOWN"` |
| Numeric        | Convert `"UNKNOWN"` → `null` |
| Date           | Convert `"UNKNOWN"` → `null` |

👉 This allows proper type casting while preserving missing data logic.

---

### 2. Missing Value Tracking (Data Quality)

To avoid losing information, we create **missing flags**:

Examples:
- `children_missing_flag`
- `agent_missing_flag`
- `country_missing_flag`
- `adr_missing_flag`

👉 This helps:
- track data quality
- support downstream analysis

---

### 3. Data Type Standardization

Columns are converted as follows:

- Integer columns → `int`
- Continuous values (e.g. `adr`) → `double`
- Date columns → `date`

Example:
- `reservation_status_date` → converted to `date`

---

### 4. Handling Invalid Data

Some records contain logically invalid values:

- `adults = 0` → invalid booking
- `adr < 0` → invalid price

👉 These rows are filtered out to ensure data consistency.

---

### 5. Removing Sensitive Data

The following columns are removed to protect privacy:

- `name`
- `email`
- `phone-number`
- `credit_card`

---

## ⚙️ Feature Engineering

New features are created to support analytics:

- `total_guests` = adults + children + babies
- `stay_nights` = weekend + weekday nights
- `room_changed` = whether assigned room differs from reserved room

---

## 📂 Output

Cleaned data is stored in:


hdfs://localhost:9000/uel_project/silver/hotel_booking


Format:
- Parquet
- Partitioned (multiple files)

---

## 🧠 Design Decisions

### Why convert `"UNKNOWN"` → `null` for numeric columns?

- Numeric operations (sum, avg) require valid numeric types
- `"UNKNOWN"` cannot be cast to numeric types
- `null` allows safe aggregation

---

### Why keep `"UNKNOWN"` for categorical columns?

- It represents a valid category (missing/unknown)
- Useful for grouping and analysis

---

### Why create missing flags?

- Prevents loss of information
- Improves data quality tracking
- Useful for machine learning and analytics

---

## 🚀 Result

The Silver layer produces:

- Clean and structured dataset
- Consistent data types
- Improved data quality
- Ready for analytics (Gold layer)

---

## 📌 Next Step

➡️ Gold Layer:
- Aggregation
- Business metrics
- Dashboard (Superset)


## 🥇 Gold Layer – Business Analytics

### Overview

The Gold layer contains business-ready datasets derived from the Silver layer.  
These datasets are aggregated and exported as CSV files for reporting, dashboarding, and chatbot support.

### Output Datasets

1. **monthly_booking_summary**
   - Total bookings by month
   - Canceled and successful bookings

2. **monthly_revenue_summary**
   - Estimated revenue by month
   - Average ADR and average stay nights

3. **cancellation_summary**
   - Cancellation rate by hotel, market segment, and deposit type

4. **country_summary**
   - Booking distribution by customer country

5. **room_type_summary**
   - Performance of each room type

6. **meal_summary**
   - Booking behavior by meal package

### Why export CSV in Gold?

CSV files are easy to:
- inspect manually
- connect to BI tools
- use in dashboards
- feed into downstream applications such as hotel chatbots

### Chatbot Use Case

The Gold layer helps a hotel chatbot answer business questions such as:
- Which month has the highest number of bookings?
- Which room type is most popular?
- Which customer segment has the highest cancellation rate?
- Which countries generate the most bookings?

This makes the chatbot faster and more reliable because it queries pre-aggregated data instead of raw records.
