# Graphify

Graphify is a powerful web application that transforms tabular data (CSV/Excel) into graph database formats. It provides an intuitive UI for mapping your data into nodes, edges, and relationships suitable for loading into graph databases like Neo4j, JanusGraph, and others.

## Features

- **File Upload**: Support for CSV and Excel files
- **Multiple File Support**: Upload and manage multiple datasets simultaneously
- **Automatic Mapping Detection**: Intelligent schema detection for your data
- **Custom Mapping Configuration**: Fine-tune how your data maps to graph elements
- **Cross-File Relationships**: Create relationships between data in different files
- **Multiple Export Formats**:
  - Neo4j Cypher queries
  - Gremlin queries (for TinkerPop-compatible databases)
  - JSON graph format
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Installation

```bash
# Clone the repository
git clone https://github.com/YKaanKaya/graphify.git

# Navigate to the project directory
cd graphify

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Usage

1. **Upload Data Files**: 
   - Upload your CSV or Excel files using the file uploader
   - Multiple files can be processed for cross-file relationship mapping

2. **Configure Mappings**:
   - Define Node Mappings: Choose which columns represent node IDs, labels, and properties
   - Define Relationship Mappings: Configure source and target nodes, relationship types
   - Create Cross-File Relationships: Map connections between data in different files

3. **Generate Graph Database Code**:
   - Select your preferred output format (Cypher, Gremlin, or JSON)
   - Copy the generated code or download it as a file
   - Use the output with your graph database system

## Examples

### Multi-file Relationship Mapping

Graphify excels at creating relationships between entities in different datasets:
- Connect products and customers across separate datasets
- Link movies to actors from different files
- Map locations to events using cross-file relationships

### Common Use Cases

- Converting relational data to graph format
- Building knowledge graphs from multiple data sources
- Preparing data for network analysis
- Migrating tabular data to graph databases

## Technology

- [Next.js](https://nextjs.org/) - React framework
- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [PapaParse](https://www.papaparse.com/) - CSV parsing
- [SheetJS](https://sheetjs.com/) - Excel file parsing

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you have any questions or need help with Graphify, please open an issue on GitHub.

---

Built with ❤️ by [YKaanKaya](https://github.com/YKaanKaya)
