import pandas as pd
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

def generate_pdf_from_csv(csv_file, output_pdf):
    # Load data from CSV
    df = pd.read_csv(csv_file)

    # Compute statistics
    total_sales = df["Sales"].sum()
    avg_growth = df["Growth"].mean()
    total_users = df["Users"].sum()

    # Set up Jinja2 environment to load HTML template
    env = Environment(loader=FileSystemLoader("."))
    template = env.get_template("template.html")

    # Render the HTML with actual data
    html_content = template.render(
        total_sales=f"${total_sales:,.2f}",
        avg_growth=f"{avg_growth:.2f}%",
        total_users=f"{total_users:,}"
    )

    # Convert HTML to PDF
    HTML(string=html_content).write_pdf(output_pdf)
    print(f"PDF saved as {output_pdf}")

# Example usage
generate_pdf_from_csv("sample_data.csv", "report.pdf")
