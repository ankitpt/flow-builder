type NodeType = "control-point" | "action" | "conditional";

class IdManager {
  private counters: Record<NodeType, number> = {
    "control-point": 0,
    action: 0,
    conditional: 0,
  };

  next(type: NodeType): number {
    const id = this.counters[type];
    this.counters[type]++;
    return id;
  }

  reset(type: NodeType): void {
    this.counters[type] = 0;
  }

  resetAll(): void {
    for (const key in this.counters) {
      this.counters[key as NodeType] = 0;
    }
  }
}

export const idManager = new IdManager();
