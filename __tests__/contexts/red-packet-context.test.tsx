import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import {
  RedPacketProvider,
  useRedPacket,
  type RedPacket,
} from "../../contexts/red-packet-context";

function wrapper({ children }: { children: React.ReactNode }) {
  return <RedPacketProvider>{children}</RedPacketProvider>;
}

describe("RedPacketContext", () => {
  describe("SGLOCAL-001: Red packet tracker", () => {
    it("provides empty packets array initially", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      expect(result.current.packets).toEqual([]);
    });

    it("adds a red packet with giver name and amount", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      act(() => {
        result.current.addPacket({
          amount: 88,
          giverName: "Grandma",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
      });

      expect(result.current.packets).toHaveLength(1);
      expect(result.current.packets[0].amount).toBe(88);
      expect(result.current.packets[0].giverName).toBe("Grandma");
      expect(result.current.packets[0].id).toBeDefined();
    });

    it("calculates total collected for a year", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      act(() => {
        result.current.addPacket({
          amount: 88,
          giverName: "Grandma",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
        result.current.addPacket({
          amount: 50,
          giverName: "Uncle",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
        result.current.addPacket({
          amount: 100,
          giverName: "Aunt",
          childId: "child-1",
          year: 2023, // Different year
          receivedAt: new Date().toISOString(),
        });
      });

      expect(result.current.getTotalForYear(2024)).toBe(138);
      expect(result.current.getTotalForYear(2023)).toBe(100);
      expect(result.current.getTotalForYear(2022)).toBe(0);
    });

    it("removes a red packet record", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      act(() => {
        result.current.addPacket({
          amount: 88,
          giverName: "Grandma",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
      });

      const packetId = result.current.packets[0].id;

      act(() => {
        result.current.removePacket(packetId);
      });

      expect(result.current.packets).toHaveLength(0);
    });

    it("gets packets for a specific year", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      act(() => {
        result.current.addPacket({
          amount: 88,
          giverName: "Grandma",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
        result.current.addPacket({
          amount: 100,
          giverName: "Aunt",
          childId: "child-1",
          year: 2023,
          receivedAt: new Date().toISOString(),
        });
      });

      const packets2024 = result.current.getPacketsForYear(2024);
      expect(packets2024).toHaveLength(1);
      expect(packets2024[0].giverName).toBe("Grandma");
    });

    it("gets all years with packets sorted descending", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      act(() => {
        result.current.addPacket({
          amount: 88,
          giverName: "Grandma",
          childId: "child-1",
          year: 2022,
          receivedAt: new Date().toISOString(),
        });
        result.current.addPacket({
          amount: 100,
          giverName: "Aunt",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
        result.current.addPacket({
          amount: 50,
          giverName: "Uncle",
          childId: "child-1",
          year: 2023,
          receivedAt: new Date().toISOString(),
        });
      });

      const years = result.current.getYearsWithPackets();
      expect(years).toEqual([2024, 2023, 2022]); // Most recent first
    });

    it("provides isCNYPeriod method", () => {
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      // isCNYPeriod returns a boolean based on current date
      // We just verify the method exists and returns a boolean
      expect(typeof result.current.isCNYPeriod()).toBe("boolean");
    });

    it("keeps packets private (not shared with family)", () => {
      // This test verifies the design: packets don't have sharing fields
      // and context doesn't expose any sharing methods
      const { result } = renderHook(() => useRedPacket(), { wrapper });

      act(() => {
        result.current.addPacket({
          amount: 88,
          giverName: "Grandma",
          childId: "child-1",
          year: 2024,
          receivedAt: new Date().toISOString(),
        });
      });

      const packet = result.current.packets[0];

      // Verify no sharing-related fields
      expect(
        (packet as unknown as Record<string, unknown>).sharedWith,
      ).toBeUndefined();
      expect(
        (packet as unknown as Record<string, unknown>).isPublic,
      ).toBeUndefined();

      // Verify no sharing methods on context
      expect(
        (result.current as unknown as Record<string, unknown>).shareWithFamily,
      ).toBeUndefined();
    });
  });
});
