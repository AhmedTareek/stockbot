import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Tool } from '@google/genai';
import { CategoryToolsService } from './tools/category-tools.service';
import { LocationToolsService } from './tools/location-tools.service';
import { ProductToolsService } from './tools/product-tools.service';
import { InventoryToolsService } from './tools/inventory-tools.service';
type ContentPart =
  | { text: string }
  | { functionCall: any }
  | { functionResponse: any };

// Type for conversation history storage
type Conversation = {
  contents: {
    role: string;
    parts: ContentPart[];
  }[];
};

@Injectable()
export class ChatbotService {
  private ai: GoogleGenAI;
  private toolFunctions: Record<string, any>;
  private conversations: Map<string, Conversation> = new Map();

  constructor(
    private categoryToolsService: CategoryToolsService,
    private locationToolsService: LocationToolsService,
    private productToolsService: ProductToolsService,
    private inventoryToolsService: InventoryToolsService,
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });
    this.toolFunctions = {
      ...this.categoryToolsService.getToolFunctions(),
      ...this.locationToolsService.getToolFunctions(),
      ...this.productToolsService.getToolFunctions(),
      ...this.inventoryToolsService.getToolFunctions(),
    };
  }

  getTools() {
    const tools: Tool[] = [
      {
        functionDeclarations: [
          ...this.categoryToolsService.getTools(),
          ...this.locationToolsService.getTools(),
          ...this.productToolsService.getTools(),
          ...this.inventoryToolsService.getTools(),
        ],
      },
    ];
    return tools;
  }

  getSystemInstructions() {
    const systemInstructions = `
    You are inventory manager that can help answer questions related to the following database schema using the functions provided to you.
{
  "tables": [
    {
      "name": "products",
      "description": "Represents products.",
      "columns": [
        {"name": "product_id", "type": "int", "description": "Unique identifier for the product (primary key)."},
        {"name": "name", "type": "varchar", "description": "Name of the product."},
        {"name": "price", "type": "double", "description": "Price of the product."},
        {"name": "reorder_point", "type": "int", "description": "The stock level at which a product should be reordered."},
        {"name": "categoryId", "type": "int", "description": "Foreign key to the categories table, linking the product to its category."},
        {"name": "sku", "type": "varchar", "description": "Stock keeping unit, a unique identifier for each product."},
        {"name": "description", "type": "varchar", "description": "A brief description of the product."}
      ],
      "relations": [
        {"foreign_key": "categoryId", "references_table": "categories", "references_column": "id"}
      ]
    },
    {
      "name": "categories",
      "description": "Stores different product categories.",
      "columns": [
        {"name": "id", "type": "int", "description": "Unique identifier for the category (primary key)."},
        {"name": "category", "type": "varchar", "description": "The name of the category (e.g., 'Electronics', 'Books')."}
      ]
    },
    {
      "name": "locations",
      "description": "Represents physical storage locations.",
      "columns": [
        {"name": "id", "type": "int", "description": "Unique identifier for the location (primary key)."},
        {"name": "location", "type": "varchar", "description": "The name or identifier of the location (e.g., 'Warehouse A', 'Store 1')."}
      ]
    },
    {
      "name": "inventories",
      "description": "Tracks the quantity of products at specific locations.{locationId,productId} are unique",
      "columns": [
        {"name": "id", "type": "int", "description": "Unique identifier for the inventory record (primary key)."},
        {"name": "quantity", "type": "int", "description": "The current stock quantity of the product at the location."},
        {"name": "last_updated", "type": "timestamp", "description": "Timestamp of the last update to the inventory record."},
        {"name": "productId", "type": "int", "description": "Foreign key to the products table, linking to the specific product."},
        {"name": "locationId", "type": "int", "description": "Foreign key to the locations table, linking to the specific location."}
      ],
      "relations": [
        {"foreign_key": "productId", "references_table": "products", "references_column": "product_id"},
        {"foreign_key": "locationId", "references_table": "locations", "references_column": "id"}
      ]
    }
  ]
}
`;
    return systemInstructions;
  }

  async processMessage(message: string, conversationId?: string) {
    // Initialize contents array
    let contents: {
      role: string;
      parts: ContentPart[];
    }[] = [];

    // If a conversationId is provided, try to load existing conversation
    if (conversationId && this.conversations.has(conversationId)) {
      // Load existing conversation history
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        contents = [...conversation.contents];
      }
    }

    // Add the new user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const tools = this.getTools();
    const systemInstructions = this.getSystemInstructions();

    while (true) {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          thinkingConfig: {
            thinkingBudget: 0,
          },
          systemInstruction: systemInstructions,
          tools: tools,
        },
      });

      console.log(response);

      if (response.functionCalls && response.functionCalls.length > 0) {
        const functionCall = response.functionCalls[0];
        console.log(functionCall);
        const { name, args } = functionCall;

        if (name && !this.toolFunctions[name]) {
          throw new Error(`Unknown function call: ${name}`);
        }
        if (!name) return;

        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
        // Call the function and get the response.
        const toolResponse = await this.toolFunctions[name](args);
        console.log(toolResponse);
        const functionResponsePart = {
          name: functionCall.name,
          response: {
            result: toolResponse,
          },
        };
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

        // Send the function response back to the model.
        contents.push({
          role: 'model',
          parts: [
            {
              functionCall: functionCall,
            },
          ],
        });
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: functionResponsePart,
            },
          ],
        });
      } else {
        // Store the conversation for future use
        if (conversationId) {
          // Store model's response in the conversation history
          if (response.text) {
            contents.push({
              role: 'model',
              parts: [{ text: response.text }],
            });
          }

          this.conversations.set(conversationId, { contents });
        }
        if (response.candidates && response.candidates[0].content?.parts) {
          console.log(response.candidates[0].content?.parts[0].text);
          return { data: response.candidates[0].content?.parts[0].text };
        }
        return response;
      }
    }
  }
}
