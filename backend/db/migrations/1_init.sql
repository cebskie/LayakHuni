-- ============================================================
-- DATABASE SCHEMA - PostgreSQL
-- ============================================================

-- Memastikan selalu mulai sari slate bersih --> Aman untuk re run
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE  ON SCHEMA public TO PUBLIC;
GRANT CREATE ON SCHEMA public TO PUBLIC;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";    -- Geometry types & spatial functions

-- ============================================================
-- ENUM TYPES
-- ============================================================
CREATE TYPE user_role_enum    AS ENUM ('Admin', 'Customer', 'Developer');
CREATE TYPE verif_status_enum AS ENUM ('Verified', 'Not Verified');
CREATE TYPE prop_status_enum  AS ENUM ('Valid', 'Non Valid');
CREATE TYPE sales_status_enum AS ENUM ('Available', 'Reserved', 'Sold');
CREATE TYPE appoint_status_enum  AS ENUM ('Deal', 'Cancel');
CREATE TYPE hak_enum AS ENUM ('Hak Milik', 'Hak Guna Usaha', 'Hak Guna Bangunan', 'Hak Pakai', 'Hak Pengelolaan', 'Hak Tanggungan');

-- ============================================================
-- TABLE: User
-- ============================================================
CREATE TABLE Pengguna(
    User_ID       UUID         NOT NULL DEFAULT gen_random_uuid(),
    User_Role     user_role_enum         NOT NULL,
    User_name     VARCHAR(100) NOT NULL,
    User_Password VARCHAR(255) NOT NULL,
    Email         VARCHAR(100) NOT NULL,
    Phone         VARCHAR(20)  NOT NULL,
    PRIMARY KEY (User_ID),
    CONSTRAINT uq_user_email UNIQUE (Email)
);

-- ============================================================
-- TABLE: Customer
-- ============================================================
CREATE TABLE Customer (
    Cust_ID   UUID        NOT NULL DEFAULT gen_random_uuid(),
    Cust_Code VARCHAR(10) NOT NULL,   -- e.g. "C001", "C002" — auto-generated via trigger
    User_ID   UUID        NOT NULL,
    PRIMARY KEY (Cust_ID),
    CONSTRAINT uq_cust_code UNIQUE (Cust_Code),
    CONSTRAINT uq_cust_user UNIQUE (User_ID),
    FOREIGN KEY (User_ID) REFERENCES Pengguna(User_ID)
);

-- ============================================================
-- TABLE: Developer
-- ============================================================
CREATE TABLE Developer (
    Dev_ID       UUID        NOT NULL DEFAULT gen_random_uuid(),
    Dev_Code     VARCHAR(10) NOT NULL,   -- e.g. "D001", "D002" — auto-generated via trigger
    User_ID      UUID        NOT NULL,
    Verified_At  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Verif_Status verif_status_enum NOT NULL,
    PRIMARY KEY (Dev_ID),
    CONSTRAINT uq_dev_code UNIQUE (Dev_Code),
    CONSTRAINT uq_dev_user UNIQUE (User_ID),
    FOREIGN KEY (User_ID) REFERENCES Pengguna(User_ID)
);

-- ============================================================
-- TABLE: Property
-- ============================================================
CREATE TABLE Property (
    Prop_ID       UUID         NOT NULL DEFAULT gen_random_uuid(),
    Dev_ID        UUID         NOT NULL,
    Property_Name VARCHAR(200) NOT NULL,
    Description   TEXT,
    Property_Status  prop_status_enum  NOT NULL,
    Sales_Status  sales_status_enum NOT NULL,
    Price Decimal(15,2) NOT NULL,
    Created_At    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Full_Address  VARCHAR(500) NOT NULL,
    PRIMARY KEY (Prop_ID),
    FOREIGN KEY (Dev_ID) REFERENCES Developer(Dev_ID)
);

-- ============================================================
-- TABLE: Photo
-- ============================================================
-- Menggunakan PostGIS GEOMETRY(Point, 4326) untuk koordinat GPS.
-- SRID 4326 = WGS84 (standar Google Maps / GPS).
-- Kolom Latitude & Longitude digabung menjadi satu kolom Location.
-- ============================================================
CREATE TABLE Photo (
    Photo_ID       UUID                   NOT NULL DEFAULT gen_random_uuid(),
    Prop_ID        UUID                   NOT NULL,
    Location       GEOMETRY(Point, 4326)  NOT NULL,  -- Koordinat GPS (lng, lat)
    KabupatenKota  VARCHAR(100),
    Kecamatan      VARCHAR(100),
    Desa           VARCHAR(100),
    Kelurahan      VARCHAR(100),
    FilePhoto_url       VARCHAR(500),
    Time_Taken     TIMESTAMP              NOT NULL,
    ServerPhoto_Address VARCHAR(255)           NOT NULL,
    PRIMARY KEY (Photo_ID),
    FOREIGN KEY (Prop_ID) REFERENCES Property(Prop_ID)
);
-- ============================================================
-- TABLE: Denah
-- ============================================================
CREATE TABLE Denah (
    Denah_ID       UUID         NOT NULL DEFAULT gen_random_uuid(),
    Prop_ID        UUID         NOT NULL,
    ServerDenah_Address VARCHAR(255) NOT NULL,
    FileDenah_url       VARCHAR(500),
    PRIMARY KEY (Denah_ID),
    FOREIGN KEY (Prop_ID) REFERENCES Property(Prop_ID)
);

-- ============================================================
-- TABLE: PBG (Persetujuan Bangunan Gedung)
-- ============================================================
CREATE TABLE PBG (
    PBG_ID          UUID          NOT NULL DEFAULT gen_random_uuid(),
    Prop_ID         UUID          NOT NULL,
    PBG_Number      VARCHAR(100)  NOT NULL,
    FilePBG_url        VARCHAR(500),
    Owner_Name      VARCHAR(200)  NOT NULL,
    WrittenPBG_Address VARCHAR(500)  NOT NULL,
    Luas_Bangunan   DECIMAL(10,2),
    PRIMARY KEY (PBG_ID),
    FOREIGN KEY (Prop_ID) REFERENCES Property(Prop_ID)
);

-- ============================================================
-- TABLE: Certificate
-- ============================================================
CREATE TABLE Certificate (
    Certif_ID       UUID          NOT NULL DEFAULT gen_random_uuid(),
    Prop_ID         UUID          NOT NULL,
    NIB             VARCHAR(100)  NOT NULL,
    FileCertif_url        VARCHAR(500),
    Hak             hak_enum  NOT NULL,
    QR_url          VARCHAR(500),
    Owner_Name      VARCHAR(200)  NOT NULL,
    WrittenCertif_Address VARCHAR(500)  NOT NULL,
    Luas_Tanah      DECIMAL(10,2),
    PRIMARY KEY (Certif_ID),
    FOREIGN KEY (Prop_ID) REFERENCES Property(Prop_ID)
);

-- Spatial index untuk mempercepat query lokasi
CREATE INDEX idx_property_location ON Photo USING GIST (Location);

-- Index untuk mempercepat query berdasarkan harga
CREATE INDEX idx_property_price ON Property(Price);

-- Index untuk query berdasarkan hak pada sertifikat
CREATE INDEX idx_property_hak ON Certificate(Hak);


