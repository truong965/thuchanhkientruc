// src/patterns/adapter/IJsonService.ts
export interface IJsonService {
    requestData(endpoint: string): Record<string, any>;
}

// src/patterns/adapter/LegacyXmlSystem.ts
// Hệ thống cũ chỉ trả về XML (Adaptee)
export class LegacyXmlSystem {
    public getXmlResponse(endpoint: string): string {
        // Giả lập call API trả về XML
        return `<response><status>200</status><data><item>Product A</item></data></response>`;
    }
}

// src/vendor/XmlParserWrapper.ts
// Interface bọc thư viện bên thứ 3 (ví dụ: fast-xml-parser) để dễ dàng mock/test
export interface IXmlParser {
    parse(xmlString: string): Record<string, any>;
}

export class FastXmlParserLib implements IXmlParser {
    public parse(xmlString: string): Record<string, any> {
        // Logic gọi thư viện thực tế ở đây
        // VD: const parser = new XMLParser(); return parser.parse(xmlString);
        return { response: { status: 200, data: { item: "Product A" } } }; // Giả lập kết quả
    }
}

// src/patterns/adapter/XmlToJsonAdapter.ts
export class XmlToJsonAdapter implements IJsonService {
    constructor(
        private legacySystem: LegacyXmlSystem,
        private parser: IXmlParser
    ) {}

    public requestData(endpoint: string): Record<string, any> {
        // 1. Lấy dữ liệu XML từ hệ thống cũ
        const xmlData = this.legacySystem.getXmlResponse(endpoint);
        
        // 2. Sử dụng thư viện parser chuẩn để parse XML thành Object (JSON format)
        try {
            const jsonData = this.parser.parse(xmlData);
            return jsonData;
        } catch (error) {
            throw new Error(`Failed to parse XML from endpoint ${endpoint}`);
        }
    }
}