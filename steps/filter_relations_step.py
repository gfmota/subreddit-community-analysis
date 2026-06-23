import duckdb, sys, os

con = duckdb.connect()

WEIGHT_PERCENTILE = 0.9  # keep top 10% strongest edges

def filter_relations(date):
    input_file  = f"storage/relations/{date}/relations.parquet"
    output_file = f"storage/relations/{date}/relations_filtered.parquet"

    threshold = con.execute(f"""
        SELECT PERCENTILE_CONT({WEIGHT_PERCENTILE})
               WITHIN GROUP (ORDER BY weight)
        FROM read_parquet('{input_file}')
    """).fetchone()[0]

    print(f"Weight threshold (p{int(WEIGHT_PERCENTILE * 100)}): {threshold:.6f}")

    con.execute(f"""
        COPY (
            SELECT *
            FROM read_parquet('{input_file}')
            WHERE weight > {threshold}
        ) TO '{output_file}' (FORMAT PARQUET);
    """)

def main():
    if len(sys.argv) < 2:
        print("Missing date")
        return

    date = sys.argv[1]
    filter_relations(date)

if __name__ == "__main__":
    main()