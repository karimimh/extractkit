def public_developer_schema(result, generator, request, public):
    """Keep the public contract API-key-only even though browser views also accept JWT."""
    for path, operations in result.get("paths", {}).items():
        for operation in operations.values():
            if not isinstance(operation, dict):
                continue
            operation["security"] = [] if path.endswith("/download/") else [{"DeveloperAPIKey": []}]

    security_schemes = result.get("components", {}).get("securitySchemes", {})
    for name in list(security_schemes):
        if name != "DeveloperAPIKey":
            del security_schemes[name]
    return result
