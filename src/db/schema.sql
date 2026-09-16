CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    source_format VARCHAR(10) NOT NULL,
    record_count BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'processing',
    error_message TEXT,
    file_name TEXT,
    file_type VARCHAR(10),
    file_size BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS file_type VARCHAR(10),
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT REFERENCES datasets(id) ON DELETE CASCADE,

    timestamp TIMESTAMPTZ,

    src_ip INET,
    dst_ip INET,

    src_port INTEGER,
    dst_port INTEGER,

    txid TEXT,

    input_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,

    input_amounts JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_amounts JSONB NOT NULL DEFAULT '[]'::jsonb,

    input_amount NUMERIC(30,12),
    output_amount NUMERIC(30,12),

    fee NUMERIC(30,12),

    script_type TEXT,

    geo_country TEXT,
    asn TEXT,

    raw JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_transactions_dataset
ON transactions(dataset_id);

CREATE INDEX IF NOT EXISTS idx_transactions_txid
ON transactions(txid);

CREATE INDEX IF NOT EXISTS idx_transactions_timestamp
ON transactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_transactions_src_ip
ON transactions(src_ip);

CREATE INDEX IF NOT EXISTS idx_transactions_dst_ip
ON transactions(dst_ip);


CREATE TABLE IF NOT EXISTS wallet_transactions (
    wallet_address TEXT NOT NULL,

    transaction_id BIGINT NOT NULL
        REFERENCES transactions(id)
        ON DELETE CASCADE,

    direction VARCHAR(10) NOT NULL
        CHECK(direction IN ('input','output')),

    amount NUMERIC(30,12),

    PRIMARY KEY (
        wallet_address,
        transaction_id,
        direction
    )
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet
ON wallet_transactions(wallet_address);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tx
ON wallet_transactions(transaction_id);


CREATE TABLE IF NOT EXISTS wallet_profiles (
    wallet_address TEXT PRIMARY KEY,

    transaction_count BIGINT NOT NULL DEFAULT 0,

    total_input NUMERIC(30,12) NOT NULL DEFAULT 0,

    total_output NUMERIC(30,12) NOT NULL DEFAULT 0,

    unique_ips BIGINT NOT NULL DEFAULT 0,

    unique_counterparties BIGINT NOT NULL DEFAULT 0,

    unique_countries BIGINT NOT NULL DEFAULT 0,

    unique_asns BIGINT NOT NULL DEFAULT 0,

    amount_mean NUMERIC(30,12) DEFAULT 0,

    amount_std NUMERIC(30,12) DEFAULT 0,

    velocity NUMERIC(30,12) DEFAULT 0,

    anomaly_score NUMERIC(10,6) NOT NULL DEFAULT 0,

    risk_score NUMERIC(6,2) NOT NULL DEFAULT 0,

    confidence NUMERIC(6,2) NOT NULL DEFAULT 0,

    severity VARCHAR(20) NOT NULL DEFAULT 'low',

    explanation JSONB NOT NULL DEFAULT '[]'::jsonb,

    features JSONB NOT NULL DEFAULT '{}'::jsonb,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_profiles_risk
ON wallet_profiles(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_profiles_severity
ON wallet_profiles(severity);


CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,

    wallet_address TEXT,

    transaction_id BIGINT
        REFERENCES transactions(id)
        ON DELETE SET NULL,

    severity VARCHAR(20) NOT NULL,

    risk_score NUMERIC(6,2) NOT NULL,

    confidence NUMERIC(6,2) NOT NULL,

    reason TEXT NOT NULL,

    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_risk
ON alerts(risk_score DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_wallet
ON alerts(wallet_address);


CREATE TABLE IF NOT EXISTS entity_edges (
    id BIGSERIAL PRIMARY KEY,

    source_type VARCHAR(30) NOT NULL,
    source_id TEXT NOT NULL,

    target_type VARCHAR(30) NOT NULL,
    target_id TEXT NOT NULL,

    relation VARCHAR(60) NOT NULL,

    weight BIGINT NOT NULL DEFAULT 1,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    UNIQUE (
        source_type,
        source_id,
        target_type,
        target_id,
        relation
    )
);

CREATE INDEX IF NOT EXISTS idx_entity_edges_source
ON entity_edges(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_entity_edges_target
ON entity_edges(target_type, target_id);


CREATE TABLE IF NOT EXISTS entity_clusters (
    id BIGSERIAL PRIMARY KEY,

    cluster_key TEXT UNIQUE NOT NULL,

    risk_score NUMERIC(6,2) NOT NULL DEFAULT 0,

    confidence NUMERIC(6,2) NOT NULL DEFAULT 0,

    member_count BIGINT NOT NULL DEFAULT 0,

    explanation JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS entity_cluster_members (
    cluster_id BIGINT NOT NULL
        REFERENCES entity_clusters(id)
        ON DELETE CASCADE,

    entity_type VARCHAR(30) NOT NULL,

    entity_id TEXT NOT NULL,

    PRIMARY KEY (
        cluster_id,
        entity_type,
        entity_id
    )
);


CREATE TABLE IF NOT EXISTS ml_runs (
    id BIGSERIAL PRIMARY KEY,

    dataset_id BIGINT
        REFERENCES datasets(id)
        ON DELETE SET NULL,

    model_name TEXT NOT NULL,

    model_version TEXT NOT NULL,

    sample_size BIGINT,

    entity_count BIGINT,

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);


CREATE TABLE IF NOT EXISTS ml_results (
    id BIGSERIAL PRIMARY KEY,

    ml_run_id BIGINT
        REFERENCES ml_runs(id)
        ON DELETE CASCADE,

    wallet_address TEXT,

    anomaly_score NUMERIC(10,6),

    prediction VARCHAR(30),

    features JSONB NOT NULL DEFAULT '{}'::jsonb,

    explanation JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ml_results_wallet
ON ml_results(wallet_address);

CREATE INDEX IF NOT EXISTS idx_ml_results_score
ON ml_results(anomaly_score DESC);